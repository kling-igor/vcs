import nodegit from 'nodegit'
import { join, dirname, basename } from 'path'

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
export async function cloneRepository(url, path, username, password) {
  let attepmpt = 0

  const remoteCallbacks = {
    certificateCheck: () => 0,
    credentials: (url, userName) => {
      // console.log('CRED URL:', url)
      // console.log('CRED USERNAME:', userName)

      if (attepmpt++ < 5) {
        return username && password ? nodegit.Cred.userpassPlaintextNew(username, password) : nodegit.Cred.defaultNew()
      }

      throw new Error('auth failed')
    }
  }

  try {
    console.log('CLONNING !!!!')
    await nodegit.Clone(url, path, {
      fetchOpts: {
        callbacks: remoteCallbacks
      }
    })
  } catch (e) {
    console.log('CLONE ERROR:', e)
    if (e.message.includes('unexpected HTTP status code:')) {
      console.log('CHECK CONNECTION...')
      throw new Error('Connection error')
    }

    if (e.message.includes('credentials callback returned an invalid cred type')) {
      console.log('AUTH REQUIRED')
      throw new Error('Auth required')
    }

    if (e.message.includes('Method connect has thrown an error.')) {
      console.log('AUTH FAILED')
      throw new Error('Auth failed')
    }

    throw new Error('Unknown clone error')
  }
}

/**
 * Gets file statuses
 * @param {Repository} repo
 * @returns {{filename:String, path:String, status:String}[]}
 */
export async function status(repo) {
  const statuses = await repo.getStatusExt()

  return statuses.map(file => {
    const filename = basename(file.path())
    const path = dirname(file.path())

    console.log('STATUS:', filename, file.status())

    return { filename, path, status: file.status() }
  })
}

export async function getRemotes(repo) {
  try {
    const remoteNames = await repo.getRemotes()

    const remotes = []

    for (const name of remoteNames) {
      const remote = await nodegit.Remote.lookup(repo, name)
      remotes.push({ name, url: remote.url() })
    }

    return remotes
  } catch (e) {
    console.log(e)
  }
  return null
}

export async function addRemote(repo, name, url) {
  return nodegit.Remote.create(repo, name, url)
}

export async function deleteRemote(repo, name) {
  return nodegit.Remote.delete(repo, name)
}

export async function getRemote(repo, name) {
  return nodegit.Remote.lookup(repo, name)
}

export async function getReferences(repo) {
  const repoRefs = []

  try {
    const refs = await repo.getReferenceNames(nodegit.Reference.TYPE.LISTALL)
    for (const refName of refs) {
      try {
        const reference = await repo.getReference(refName)
        if (reference.isConcrete()) {
          // console.log('Concrete reference:', refName, reference.target().toString())

          if (reference.isTag()) {
            const targetRef = await reference.peel(nodegit.Object.TYPE.COMMIT)
            const commit = await repo.getCommit(targetRef)
            repoRefs.push({
              name: refName,
              sha: commit.toString()
            })
          } else {
            if (!refName.includes('refs/stash')) {
              repoRefs.push({
                name: refName,
                sha: reference.target().toString()
              })
            }
          }
        } else if (reference.isSymbolic()) {
          // console.log('Symbolic reference:', refName, reference.symbolicTarget().toString())
        }
      } catch (e) {
        console.log('UNABLE TO GET REFERENCE:', refName, e)
      }
    }
  } catch (e) {
    console.log('UNABLE TO GET REFERENCE NAMES')
  }

  return repoRefs
}
