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

  const repoRefs = await getReferences(repo)

  // собираем информацию о том как локальные ветки отстают или опережают удаленные
  for (const item of repoRefs) {
    if (item.name.includes('refs/heads')) {
      const localBranchName = item.name.replace('refs/heads/', '')
      const branch = await nodegit.Branch.lookup(repo, localBranchName, nodegit.Branch.BRANCH.LOCAL)

      try {
        const remoteBranchRef = await nodegit.Branch.upstream(branch)
        const remoteBranchName = remoteBranchRef.name()
        const localCommit = await repo.getReferenceCommit(item.name)
        const remoteCommit = await repo.getReferenceCommit(remoteBranchName)
        const { ahead, behind } = await nodegit.Graph.aheadBehind(repo, localCommit.id(), remoteCommit.id())
        item.ahead = ahead
        item.behind = behind
        item.upstream = remoteBranchName
      } catch (e) {
        console.log('UNABLE TO FIND UPSTREAM FOR:', localBranchName)
      }
    }
  }

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
    let branch = headCommit ? getBranch(headCommit.sha()) : getBranch(null) // TODO: если еще не было коммитов и это изменения в новом репозитарии ?
    const offset = reserve.indexOf(branch)

    if (offset === -1) {
      console.log('INVALID OFFSET FOR HEAD COMMIT OR FOR DIRTY WT OF EMPTY REPO')
    }

    commits.push({
      // sha: undefined,
      message: 'Uncommitted changes',
      // committer: undefined,
      date: Date.now(),
      offset,
      branch,
      routes: [...fillRoutes(I, I, reserve)]
    })
  } /* // нельзя так делать !!! т.к. с этим связан массив reserve 
  else {
    branchIndex += 1 // пропускаем серую ветку ???
  }*/

  const revWalk = repo.createRevWalk()
  revWalk.sorting(nodegit.Revwalk.SORT.TIME)
  revWalk.pushGlob('refs/tags/*') // чтобы захватить все рефернесы (иначе не все попадет)
  revWalk.pushGlob('refs/heads/*')
  revWalk.pushGlob('refs/remotes/*')

  let oid

  try {
    oid = await revWalk.next()
  } catch (e) {
    console.log('REVWALK ERROR - POSSIBLE REPO IS EMPTY')
    return // nothing to return
  }

  let maxOffset = 0

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

    maxOffset = Math.max(maxOffset, offset)

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
    // delete branches[sha]

    let message = commit.summary()
    if (message.length > 80) {
      message = message.slice(0, 79) + '\u2026'
    }

    const record = {
      sha,
      isHead: sha === headCommit.sha() && workDirStatus.length === 0,
      message,
      committer: getCommiterIndex(commit.author().name(), commit.author().email()),
      date: commit.timeMs(),
      offset,
      branch,
      routes
    }

    commits.push(record)

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
    refs: !headOnBranchTop ? [{ name: 'HEAD', sha: headCommit.sha().slice(0, 8) }, ...repoRefs] : repoRefs,
    commits,
    committers,
    headCommit: (headCommit && headCommit.sha().slice(0, 8)) || undefined,
    currentBranch,
    maxOffset, // нужно чтобы знать максимальную ширину Canvas
    isMerging: repo.isMerging(),
    isRebasing: repo.isRebasing(),
    hasConflicts
  }
}
