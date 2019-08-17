import nodegit from 'nodegit'
import { resolve, join } from 'path'
import { ensureDir, writeFile } from 'fs-extra'

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
  await index.writeTree()
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
async function createTag(repo, commit, tagName, tagMessage) {
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
async function createBranch(repo, name, commit) {
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
async function deleteTagByName(repo, tagName) {
  await repo.deleteTagByName(tagName)
}

/**
 * Checkouts on specified branch (rejecting working directory changes)
 * @param {Repository} repo
 * @param {String} [branch='master']
 */
async function checkout(repo, branch = 'master') {
  await repo.checkoutBranch(branch, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
  })
}

async function checkoutRemoteBranch(repo, branchName) {
  await checkout(repo, branchName)
  const commit = await repo.getReferenceCommit(`refs/remotes/origin/${branchName}`)
  await nodegit.Reset.reset(repo, commit, 3, {})
}

async function fetch(repo, username, password) {
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

async function pull(repo, username, password) {
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

async function addRemote(repo, url) {
  return nodegit.Remote.create(repo, 'origin', url)
}

async function push(remote, username, password) {
  await remote.push(['refs/heads/master:refs/heads/master'], {
    callbacks: {
      // github will fail cert check on some OSX machines, this overrides that check
      certificateCheck: () => 0,
      credentials: username && password ? () => nodegit.Cred.userpassPlaintextNew(username, password) : null
      // transferProgress: progress => console.log('clone progress:', progress)
    }
  })
}
