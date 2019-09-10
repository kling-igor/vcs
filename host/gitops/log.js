import nodegit from 'nodegit'

import { status, getReferences } from './repository'

/**
 * gitlog
 * @param {Repository} repo
 * @returns {{refs:Array, commits:Array, committers:[]}}
 */
export async function log(repo) {
  try {
    const I = i => i

    let repoRefs

    let branchIndex = 0
    const reserve = []
    const branches = {}

    const committers = []
    const commits = []

    const getBranch = sha => {
      if (branches[sha] == null) {
        branches[sha] = branchIndex
        reserve.push(branchIndex)
        branchIndex += 1
      }

      return branches[sha]
    }

    const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])

    let recentCommits = []

    try {
      repoRefs = await getReferences(repo)
      const heads = repoRefs.filter(ref => ref.name.includes('refs/heads/'))
      for (const { name } of heads) {
        try {
          const commit = await repo.getBranchCommit(name)
          recentCommits.push({ sha: commit.sha(), date: commit.date() })
        } catch (e) {
          console.log('E:', e)
        }
      }
    } catch (e) {
      console.log('GET REFS ERROR:', e)
    }

    let headCommit
    try {
      headCommit = await repo.getHeadCommit()
    } catch (e) {
      console.log('UNABLE TO GET HEAD:', e)
    }

    const currentBranch = await repo.getCurrentBranch()

    const workDirStatus = await status(repo)

    // делаем искусственную запись
    if (repo.isMerging()) {
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
      try {
        const branch = (headCommit && getBranch(headCommit.sha())) || getBranch(null) // TODO: если еще не было коммитов и это изменения в новом репозитарии ?
        const offset = reserve.indexOf(branch)
        commits.push({
          sha: null,
          message: 'Uncommited changes',
          committer: null,
          date: Date.now(),
          offset,
          branch,
          routes: [...fillRoutes(I, I, reserve)]
        })
      } catch (e) {
        console.log('ERROR:', e)
      }
    } else {
      branchIndex += 1 // пропускаем серую ветку
    }

    let revWalk
    let oid

    try {
      revWalk = repo.createRevWalk()
      revWalk.sorting(nodegit.Revwalk.SORT.TIME)
      // revWalk.pushGlob('refs/heads/*')
      revWalk.pushGlob('refs/*') // чтобы захватить remote ветки
      oid = await revWalk.next()
    } catch (e) {
      console.log('revWalk.next() ERROR', e)
    }

    while (oid) {
      try {
        const commit = await repo.getCommit(oid)

        const sha = commit.toString()
        // console.log('*** LOG COMMIT:', sha)

        const parents = commit.parents().map(parent => parent.toString())
        const [parent, otherParent] = parents

        // console.log('*** LOG COMMIT PARENTS:', parent, otherParent)

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

        const authorName = commit.author().name()
        const authorEmail = commit.author().email()
        const authorDate = commit.timeMs()

        let committerIndex
        const foundIndex = committers.findIndex(({ name, email }) => name === authorName && email === authorEmail)
        if (foundIndex !== -1) {
          committerIndex = foundIndex
        } else {
          committerIndex = committers.length
          committers.push({ name: authorName, email: authorEmail })
        }

        let message = commit.message()
        if (message.length > 80) {
          message = message.slice(0, 79) + '\u2026'
        }

        commits.push({
          sha,
          isHead: sha === headCommit.sha() && workDirStatus.length === 0,
          message: message.slice(0, 80),
          committer: committerIndex,
          date: authorDate,
          offset,
          branch,
          routes
        })

        if (parents.length === 0) {
          break
        }

        oid = await revWalk.next()
      } catch (e) {
        console.log('GITLOG ERROR:', e)
      }
    } // while

    const index = await repo.index()
    const hasConflicts = index.hasConflicts()

    // если HEAD не на вершине ветки
    const headOnBranchTop = recentCommits.find(({ sha }) => sha === headCommit.sha())

    console.log('headOnBranchTop:', !!headOnBranchTop)

    return {
      // опционально добавляем HEAD ссылку
      refs: !headOnBranchTop ? [{ name: 'HEAD', sha: headCommit.sha() }, ...repoRefs] : repoRefs,
      commits,
      committers,
      headCommit: headCommit.sha(),
      currentBranch: currentBranch.shorthand(),
      isMerging: repo.isMerging(),
      isRebasing: repo.isRebasing(),
      hasConflicts
    }
  } catch (e) {
    console.log('LOG ERROR:', e)
  }
}
