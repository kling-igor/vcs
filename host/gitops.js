import nodegit from 'nodegit'
import { resolve, join } from 'path'
import { ensureDir, writeFile } from 'fs-extra'

/**
 * @returns {Config}
 */
export async function findConfig() {
  let configPath

  try {
    configPath = await nodegit.Config.findGlobal()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findProgramdata()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findSystem()
  } catch (e) {
    console.log(e)
  }

  try {
    configPath = await nodegit.Config.findXdg()
  } catch (e) {
    console.log(e)
  }

  if (configPath) {
    return await nodegit.Config.openOndisk(configPath)
  }

  return null
}

/**
 *
 * @param {Repository} repo
 * @returns {Config}
 */
export async function openRepoConfig(repo) {
  return await repo.config()
}

/**
 *
 * @param {Config} config
 * @returns {name:String, email:String}
 */
export async function userNameEmail(config) {
  const name = await config.getStringBuf('user.name')
  const email = await config.getStringBuf('user.email')

  return { name, email }
}

/**
 * Opens git repository by specified path
 * @param {String} path
 * @returns {Repository}
 */
export async function openRepository(path) {
  return nodegit.Repository.open(join(path, '.git'))
}

/**
 * Creates git repository in specified path
 * @param {String} path
 * @returns {Repository}
 */
export async function createRepository(path) {
  return nodegit.Repository.init(path, 0)
}

/**
 * Clones remote repository
 * @param {String} url- repo remote url
 * @param {String} path - path to clone repo to
 * @param {String} [username] - optional username
 * @param {String} [password] - optional password
 */
export async function cloneRepo(url, path, username, password) {
  return await nodegit.Clone(url, path, {
    fetchOpts: {
      callbacks: {
        certificateCheck: () => 0, // github will fail cert check on some OSX machines, this overrides that check
        credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null
        // transferProgress: progress => console.log('clone progress:', progress)
      }
    }
  })
}

export async function references(repo) {
  const repoRefs = []

  try {
    const refs = await repo.getReferenceNames(nodegit.Reference.TYPE.LISTALL)
    try {
      for (const refName of refs) {
        const reference = await repo.getReference(refName)
        if (reference.isConcrete()) {
          console.log('Concrete reference:', refName, reference.target().toString())

          const name = refName.replace('refs/heads/', '').replace('refs/remotes/', '')
          repoRefs.push({
            name,
            sha: reference.target().toString()
          })
        } else if (reference.isSymbolic()) {
          console.log('Symbolic reference:', refName, reference.symbolicTarget().toString())
        }
      }
    } catch (e) {
      console.log('unable to get reference info:', e)
    }
  } catch (e) {
    console.log('UNABLE TO GET REFS')
  }

  return repoRefs
}

/**
 * Refreshes index
 * @param {Repository} repository
 * @returns {Index}
 */
export async function refreshIndex(repository) {
  return repository.refreshIndex()
}

/**
 * Adds path to index
 * Finally you have to call writeIndex to fix all index changes
 * @param {Index} index
 * @param {String} path
 */
export async function addToIndex(index, path) {
  return index.addByPath(path)
}
/**
 * Removes path from index
 * Finally you have to call writeIndex to fix all index changes
 * @param {Index} index
 * @param {String} path
 */
export async function removeFromIndex(index, path) {
  return index.removeByPath(path)
}

/**
 * Writes to index
 * @param {Index} index
 * @returns {OID}
 */
export async function writeIndex(index) {
  await index.write()
  return await index.writeTree()
}

function fileStatus(file) {
  let result = ''
  if (file.isNew()) {
    result += 'A'
  }
  if (file.isModified()) {
    result += 'M'
  }
  // if (file.isTypechange()) { result += ''};
  if (file.isRenamed()) {
    result += 'R'
  }
  if (file.isIgnored()) {
    result += '?'
  }
  if (file.isDeleted()) {
    result += 'D'
  }
  if (file.isConflicted()) {
    result += 'C'
  }
  if (file.inIndex()) {
    result += 'I'
  }
  return result
}

/**
 * Gets file statuses
 * @param {Repository} repo
 * @returns {{path:String, status:String}[]}
 */
export async function status(repo) {
  const statuses = await repo.getStatus()
  return statuses.map(file => ({ path: file.path(), status: fileStatus(file) }))
}

/**
 * Creates tag on commit
 * @param {Repository} repo
 * @param {{String | Oid}} commit
 * @param {String} tagName
 * @param {String} tagMessage
 */
export async function createTag(repo, commit, tagName, tagMessage) {
  let oid
  if (typeof commit === 'string') {
    oid = nodegit.Oid.fromString(commit)
  }
  return await repo.createTag(oid || commit, tagName, tagMessage)
}

/**
 * Creates branch
 * @param {Repository} repo
 * @param {String} name
 * @param {String | Oid} commit
 * @returns {Reference}
 */
export async function createBranch(repo, name, commit) {
  let oid
  if (typeof commit === 'string') {
    oid = nodegit.Oid.fromString(commit)
  }

  return await repo.createBranch(name, oid || commit, 0 /* do not overwrite if exists */)
}

/**
 * Deletes tag
 * @param {Repository} repo
 * @param {String} tagName
 */
export async function deleteTagByName(repo, tagName) {
  await repo.deleteTagByName(tagName)
}

/**
 * Checkouts on specified branch (rejecting working directory changes)
 * @param {Repository} repo
 * @param {String} [branch='master']
 */
export async function checkout(repo, branch = 'master') {
  await repo.checkoutBranch(branch, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
  })
}

export async function resetToCommit(repo, sha) {
  const oid = nodegit.Oid.fromString(sha)
  const commit = await repo.getCommit(oid)
  return nodegit.Reset.reset(repo, commit, nodegit.Reset.TYPE.HARD, {})
}

export async function checkoutRemoteBranch(repo, branchName) {
  await checkout(repo, branchName)
  const commit = await repo.getReferenceCommit(`refs/remotes/origin/${branchName}`)
  await resetToCommit(repo, commit)
}

export async function checkoutToCommit(repo, sha) {
  console.log('checkoutToCommit', sha)
  const oid = nodegit.Oid.fromString(sha)
  const commit = await repo.getCommit(oid)
  await nodegit.Checkout.tree(repo, commit, { checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE })
  return await repo.setHeadDetached(commit)
}

export async function fetch(repo, username, password) {
  return await repo.fetch('origin', {
    fetchOpts: {
      callbacks: {
        // github will fail cert check on some OSX machines, this overrides that check
        certificateCheck: () => 0,
        credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null,
        transferProgress: progress => console.log('clone progress:', progress)
      }
    }
  })
}

export async function pull(repo, username, password) {
  await repo.fetchAll({
    fetchOpts: {
      callbacks: {
        // github will fail cert check on some OSX machines, this overrides that check
        certificateCheck: () => 0,
        credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null
        // transferProgress: progress => console.log('clone progress:', progress)
      }
    }
  })

  await repo.mergeBranches('master', 'origin/master')
}

export async function addRemote(repo, url) {
  return nodegit.Remote.create(repo, 'origin', url)
}

export async function push(remote, username, password) {
  await remote.push(['refs/heads/master:refs/heads/master'], {
    callbacks: {
      // github will fail cert check on some OSX machines, this overrides that check
      certificateCheck: () => 0,
      credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null
      // transferProgress: progress => console.log('clone progress:', progress)
    }
  })
}

export async function commit(repo, treeOid, message, name = 'User', email = 'no email') {
  const author = nodegit.Signature.now(name, email)
  const committer = author

  let head

  try {
    head = await nodegit.Reference.nameToId(repo, 'HEAD')
  } catch (e) {
    console.log('COMMIT:GET_HEAD ERROR:', e)
  }

  let parent
  if (head) {
    parent = await repo.getCommit(head)
  }

  let commitId
  try {
    commitId = await repo.createCommit('HEAD', author, committer, message, treeOid, [parent])
  } catch (e) {
    console.log('COMMIT:CREATE_COMMIT ERROR:', e)
  }
  return commitId
}

/**
 * File current and parent versions
 * @param {Repository} repo
 * @param {String} sha
 * @param {String} filePath - file relative path to repository
 */
export async function fileDiffToParent(repo, sha, filePath) {
  const oid = nodegit.Oid.fromString(sha)
  const commit = await repo.getCommit(oid)

  let originalContent = ''
  let modifiedContent = ''

  const [parentSha] = commit.parents()
  if (parentSha) {
    const parentCommit = await repo.getCommit(parentSha)

    const originalEntry = await parentCommit.getEntry(filePath)

    if (originalEntry && originalEntry.isFile()) {
      originalContent = (await originalEntry.getBlob()).toString()
    }
  }

  const modifiedEntry = await commit.getEntry(filePath)

  if (modifiedEntry.isFile()) {
    modifiedContent = (await modifiedEntry.getBlob()).toString()

    return {
      originalContent,
      modifiedContent
    }
  }

  return { details: 'ERROR!!!!' }
}

/**
 * Commit info
 * @param {Repository} repo
 * @param {String} sha
 * @returns {{Object}[]}
 */
export async function commitInfo(repo, sha) {
  const oid = nodegit.Oid.fromString(sha)
  try {
    const commit = await repo.getCommit(oid)

    const paths = []

    // получать за один раз такой объем информации - накладно при передаче в рендер
    // TODO: добавить метод получения diff только для одного указанного файла
    // изначально render будет получать только список измененных файлов
    // потом при выделении на файлах будут запрашиваться детали по каждому файлу
    const diffList = await commit.getDiff()
    for (const diff of diffList) {
      const patches = await diff.patches()
      for (const patch of patches) {
        const found = paths.find(
          ({ oldPath, newPath }) => oldPath === patch.oldFile().path() && newPath === patch.newFile().path()
        )
        if (!found) {
          paths.push({ oldPath: patch.oldFile().path(), newPath: patch.newFile().path() })
        }

        // const hunks = await patch.hunks()
        // for (const hunk of hunks) {
        // console.log('----------------------------------------------------------')
        // console.log('diff', patch.oldFile().path(), patch.newFile().path())
        // console.log(hunk.header().trim())
        // const lines = await hunk.lines()
        // for (const line of lines) {
        // console.log(String.fromCharCode(line.origin()) + line.content().trim())
        // }
        // }
      }
    }
    /*
    try {
      // const tree = await commit.getTree()

      for (const { old: oldPath, new: newPath } of paths) {
        // console.log('newPath:', newPath)
        const entry = await commit.getEntry(oldPath)
        const blob = await entry.getBlob()
        console.log(`${entry.name()}:${blob.rawsize()} bytes`)
        // console.log(blob.toString())

        // const entry = await tree.getEntry(newPath)
        // entry.getBlob((error, blob) => {
        //   if (error) {
        //     console.log('get blob error:', error)
        //   } else {
        //     console.log('Blob size:', blob.size())
        //   }
        // })
      }
    } catch (e) {
      console.log('TREE ERROR:', e)
    }
*/

    const repoRefs = await references(repo)

    const labels = repoRefs.filter(item => item.sha === sha).map(({ name }) => name)

    return {
      commit: commit.toString(),
      author: {
        name: commit.author().name(),
        email: commit.author().email()
      },
      date: commit.time(),
      message: commit.message(),
      parents: commit.parents().map(parent => parent.toString()),
      paths,
      labels
    }
  } catch (e) {
    console.log('COMMIT INFO ERROR:', e)
  }

  return null
}

export async function headCommit(repo) {
  const headCommit = await repo.getHeadCommit()
  return headCommit.toString()
}

/**
 * gitlog
 * @param {Repository} repo
 * @returns {{refs:Array, commits:Array, commiters:[]}}
 */
export async function log(repo) {
  const I = i => i

  let branchIndex = 0
  const reserve = []
  const branches = {}

  const commiters = []
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

  const repoRefs = await references(repo)

  const workDirStatus = await status(repo)
  const headCommit = await repo.getHeadCommit()
  const masterCommit = await repo.getMasterCommit()

  if (workDirStatus.length > 0) {
    console.log('WORK IS DIRTY!!!: ', headCommit.sha())
    const branch = getBranch(headCommit.sha()) // TODO: если еще не было коммитов и это изменения в новом репозитарии ?
    const offset = reserve.indexOf(branch)
    console.log('BRANCH:', branch)
    console.log('OFFSET:', offset)

    commits.push({
      sha: null,
      message: 'Uncommited changes',
      commiter: null,
      date: Date.now(),
      offset,
      branch,
      routes: [...fillRoutes(I, I, reserve)]
    })
  } else {
    branchIndex += 1 // пропускаем серую ветку
  }

  // если HEAD не на master
  const headNotOnMaster = headCommit.sha() !== masterCommit.sha()
  // console.log('HEAD:', headCommit.sha())
  // console.log('MASTER:', masterCommit.sha())
  // console.log('headNotOnMaster:', headNotOnMaster)

  // если head сдвинут, то историю будем обходит с master коммитов (а если они не самые свежие ???)
  const commit = headNotOnMaster ? masterCommit : headCommit

  const revWalk = repo.createRevWalk()
  revWalk.sorting(nodegit.Revwalk.SORT.TOPOLOGICAL)
  revWalk.push(commit.sha())

  const walk = async () => {
    try {
      const oid = await revWalk.next()
      if (!oid) return

      const commit = await repo.getCommit(oid)

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

            // значение offset далее невалидно, т.к. соответсвующее значение удалено из списка
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
      const authorDate = commit.time()

      let commiterIndex
      const foundIndex = commiters.findIndex(({ name, email }) => name === authorName && email === authorEmail)
      if (foundIndex !== -1) {
        commiterIndex = foundIndex
      } else {
        commiterIndex = commiters.length
        commiters.push({ name: authorName, email: authorEmail })
      }

      let message = commit.message()
      if (message.length > 80) {
        message = message.slice(0, 79) + '\u2026'
      }

      commits.push({
        sha,
        isHead: sha === headCommit.sha() && workDirStatus.length === 0,
        message: message.slice(0, 80),
        commiter: commiterIndex,
        date: authorDate,
        offset,
        branch,
        routes
      })

      if (parents.length === 0) {
        return {
          // опционально добавляем HEAD ссылку
          refs: headNotOnMaster ? [{ name: 'HEAD', sha: headCommit.sha() }, ...repoRefs] : repoRefs,
          commits,
          commiters
        }
      }

      // TODO:!!! НАГРУЖАЕТСЯ СТЕК!!!! - использовать другое решение
      return await walk()
    } catch (e) {
      console.log(e)
    }
  }

  return await walk()
}
