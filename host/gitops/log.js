import nodegit from 'nodegit'

import { status, getReferences } from './repository'

const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])
const I = i => i

/**
 * gitlog
 * @param {Repository} repo
 * @returns {{refs:Array, commits:Array, committers:[]}}
 */
export async function log(repo) {
  // для определения в каком столбце будет рисоваться ветка
  let branchIndex = 0
  const reserve = []
  const branches = {}
  const getBranch = sha => {
    if (branches[sha] == null) {
      branches[sha] = branchIndex
      reserve.push(branchIndex)
      branchIndex += 1
    }

    return branches[sha]
  }

  // словарь коммитеров (чтобы удалить дублирования информации)
  const committers = []

  const getCommiterIndex = (name, email) => {
    const foundIndex = committers.findIndex(commiter => commiter.name === name && commiter.email === email)
    if (foundIndex !== -1) {
      return foundIndex
    } else {
      committers.push({ name, email })
      return committers.length - 1
    }
  }

  // отслеживание коммитов веток на предмет ahead-behind
  const trackedBranches = {}

  const repoRefs = await getReferences(repo)

  let headCommit
  try {
    headCommit = await repo.getHeadCommit()
  } catch (e) {
    console.log('UNABLE TO GET HEAD, POSSIBLE REPO IS EMPTY:', e)
  }

  let currentBranch
  try {
    currentBranch = (await repo.getCurrentBranch()).shorthand()
  } catch (e) {
    console.log('NO HEAD BRANCH - POSSIBLE REPO IS EMPTY')
  }

  const workDirStatus = await status(repo)

  // тут собираем конечный результат git log
  const commits = []

  // делаем искусственную запись
  if (headCommit && (repo.isMerging() || repo.isRebasing())) {
    try {
      const mineCommit = headCommit.sha()
      const theirsCommit = (await repo.getBranchCommit('MERGE_HEAD')).sha()

      const branch = getBranch(mineCommit)
      const offset = reserve.indexOf(branch)

      let routes = fillRoutes(I, I, reserve)

      branches[mineCommit] = branch

      const theirsBranch = getBranch(theirsCommit)
      routes = [...routes, [offset, reserve.indexOf(theirsBranch), theirsBranch]]

      commits.push({
        sha: null,
        isHead: false,
        message: 'Merging...',
        committer: null,
        date: Date.now(),
        offset: 0,
        branch,
        routes
      })
    } catch (e) {
      console.log('ERROR:', e)
    }
  } else if (workDirStatus.length > 0) {
    const branch = (headCommit && getBranch(headCommit.sha())) || getBranch(null) // TODO: если еще не было коммитов и это изменения в новом репозитарии ?
    const offset = reserve.indexOf(branch)

    if (offset === -1) {
      console.log('INVALID OFFSET FOR HEAD COMMIT OR FOR DIRTY WT OF EMPTY REPO')
    }

    commits.push({
      sha: null,
      message: 'Uncommited changes',
      committer: null,
      date: Date.now(),
      offset,
      branch,
      routes: [...fillRoutes(I, I, reserve)]
    })
  } else {
    branchIndex += 1 // пропускаем серую ветку ???
  }

  const revWalk = repo.createRevWalk()
  revWalk.sorting(nodegit.Revwalk.SORT.TIME)
  revWalk.pushGlob('refs/*') // чтобы захватить все рефернесы (иначе не все попадет)

  let oid

  try {
    oid = await revWalk.next()
  } catch (e) {
    console.log('REVWALK ERROR - POSSIBLE REPO IS EMPTY')
    return // nothing to return
  }

  while (oid) {
    let commit
    try {
      commit = await repo.getCommit(oid)
    } catch (e) {
      console.log('UNABLE TO GET COMMIT')
      break
    }
    const sha = commit.toString()

    const parents = commit.parents().map(parent => parent.toString())
    const [parent, otherParent] = parents

    const branch = getBranch(sha)
    const offset = reserve.indexOf(branch)

    let routes = []

    if (parents.length === 1) {
      if (branches[parent] == null) {
        // straight
        routes = [...fillRoutes(I, I, reserve)]
        branches[parent] = branch
      } else {
        routes = [
          // все возможные ветки правее текущей загибаем влево
          ...fillRoutes(i => i + offset + 1, i => i + offset + 1 - 1, reserve.slice(offset + 1)),
          // все возможные ветки левее текущей продолжают идти параллельно
          ...fillRoutes(I, I, reserve.slice(0, offset))
        ]

        // удаляем текущую ветку из списка
        reserve.splice(offset, 1)

        // загибаем текущую ветку в сторону ее родителя
        routes = [...routes, [offset, reserve.indexOf(branches[parent]), branch]]
      }
    } else if (parents.length === 2) {
      if (branches[parent] == null) {
        branches[parent] = branch
      } else {
        const parentOffset = reserve.indexOf(branches[parent])
        if (parentOffset !== offset) {
          // загибаем
          routes = [...routes, [offset, parentOffset, branch]]
          reserve.splice(offset, 1)

          // значение offset далее невалидно, т.к. соответствующее значение удалено из списка
          for (const i of Object.keys(branches)) {
            if (branches[i] >= offset) {
              branches[i] -= 1
            }
          }
        }
      }

      routes = [...routes, ...fillRoutes(I, I, reserve)]

      const otherBranch = getBranch(otherParent)
      routes = [...routes, [offset, reserve.indexOf(otherBranch), otherBranch]]
    }

    // удаляем ветку из кеша (на нее никто не ссылается больше)
    delete branches[sha]

    let message = commit.summary()
    if (message.length > 80) {
      message = message.slice(0, 79) + '\u2026'
    }

    commits.push({
      sha,
      isHead: sha === headCommit.sha() && workDirStatus.length === 0,
      message,
      committer: getCommiterIndex(commit.author().name(), commit.author().email()),
      date: commit.timeMs(),
      offset,
      branch,
      routes
    })

    // first ever commit
    if (parents.length === 0) {
      break
    }

    try {
      oid = await revWalk.next()
    } catch (e) {
      console.log('REVWALK ERROR:', e)
      break
    }
  } // while

  const index = await repo.index()
  const hasConflicts = index.hasConflicts()

  // если HEAD не на вершине ветки
  const headOnBranchTop =
    headCommit && repoRefs.find(({ sha, name }) => sha === headCommit.sha() && !name.includes('refs/tags/'))

  return {
    // опционально добавляем HEAD ссылку
    refs: !headOnBranchTop ? [{ name: 'HEAD', sha: headCommit.sha() }, ...repoRefs] : repoRefs,
    commits,
    committers,
    headCommit: (headCommit && headCommit.sha()) || undefined,
    currentBranch,
    isMerging: repo.isMerging(),
    isRebasing: repo.isRebasing(),
    hasConflicts
  }
}
