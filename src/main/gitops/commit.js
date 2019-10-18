import nodegit from 'nodegit'

import { getReferences } from './repository'

export async function commit(repo, message, name = 'User', email = 'no email', mergingCommitSha) {
  const index = await repo.index()
  const treeOid = await index.writeTree()

  const author = nodegit.Signature.now(name, email)
  const committer = author

  let commitId
  let branchName
  try {
    const branchRef = await repo.head()
    branchName = branchRef.name()
  } catch (e) {
    console.log('COMMIT ERROR - UNABLE TO GET HEAD:', e)
    branchName = 'HEAD'
    // first commit
    commitId = await repo.createCommit(branchName, author, committer, message, treeOid, [])
    return commitId
  }

  const branchOid = await nodegit.Reference.nameToId(repo, branchName)
  const parent = await repo.getCommit(branchOid)

  let other
  if (mergingCommitSha) {
    repo.stateCleanup()
    await index.conflictCleanup()
    const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(mergingCommitSha), 8)).sha()
    other = await repo.getCommit(fullSHA)
  }

  const parents = [parent, other].filter(item => !!item)

  console.log('COMMIT PARENTS:', parents.map(item => item.sha()))

  try {
    commitId = await repo.createCommit(branchName, author, committer, message, treeOid, parents)
  } catch (e) {
    console.log('COMMIT:CREATE_COMMIT ERROR:', e)
  }
  return commitId
}

/**
 * Commit info
 * @param {Repository} repo
 * @param {String} sha
 * @returns {{Object}[]}
 */
export async function commitInfo(repo, sha) {
  // странное поведение commit.getDiff() если брать commit как результат nodegit.Commit.lookupPrefix
  const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(sha), 8)).sha()
  const oid = nodegit.Oid.fromString(fullSHA)
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

    const repoRefs = await getReferences(repo)

    const labels = repoRefs
      .filter(item => item.sha === commit.sha())
      .map(({ name }) => name.replace('refs/tags/', '').replace('refs/remotes/', ''))

    return {
      commit: commit.toString(),
      author: {
        name: commit.author().name(),
        email: commit.author().email()
      },
      date: commit.time(),
      message: commit.message(),
      parents: commit.parents().map(parent => parent.toString()),
      paths: paths.map(({ newPath }) => {
        const parts = newPath.split('/')
        const filename = parts.pop()
        const path = parts.join('/')
        // TODO: missing status!!!
        return { filename, path }
      }),
      labels
    }
  } catch (e) {
    console.log('COMMIT INFO ERROR:', e)
  }

  return null
}

export async function headCommit(repo) {
  return (await repo.getHeadCommit()).toString()
}

/**
 * Checkouts on specified commit (optionally rejecting working directory changes)
 * @param {Repository} repo
 * @param {String} sha
 * @param {Boolean} discardLocalChanges
 * @see https://libgit2.org/docs/guides/101-samples/
 * @see https://github.com/libgit2/libgit2/blob/HEAD/include/git2/checkout.h#files
 */
export async function checkoutToCommit(repo, sha, discardLocalChanges) {
  console.log('checkoutToCommit:', sha, discardLocalChanges)
  const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(sha), 8)).sha()
  const oid = nodegit.Oid.fromString(fullSHA)
  const commit = await repo.getCommit(oid)
  await nodegit.Checkout.tree(repo, commit, {
    checkoutStrategy: discardLocalChanges ? nodegit.Checkout.STRATEGY.FORCE : nodegit.Checkout.STRATEGY.SAFE
  })
  return repo.setHeadDetached(commit)
}

async function resetToCommit(repo, sha, kind, options = {}) {
  const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(sha), 8)).sha()
  const oid = nodegit.Oid.fromString(fullSHA)
  const commit = await repo.getCommit(oid)
  return nodegit.Reset.reset(repo, commit, kind, options)
}

export async function softResetToCommit(repo, sha) {
  return resetToCommit(repo, sha, nodegit.Reset.TYPE.SOFT)
}

export async function mixedResetToCommit(repo, sha) {
  return resetToCommit(repo, sha, nodegit.Reset.TYPE.MIXED)
}

export async function hardResetToCommit(repo, sha) {
  return resetToCommit(repo, sha, nodegit.Reset.TYPE.HARD, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE
  })
}

export async function discardLocalChanges(repo, paths) {
  // const index = await repo.index()
  //   return nodegit.Checkout.index(repo, index, {
  //   checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
  //   paths: Array.isArray(paths) ? paths : [paths]
  // })

  //   const commit = await repo.headCommit();
  //   const tree = await commit.getTree();
  //   return nodegit.Checkout.tree(repo, tree, {
  //     checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
  //     paths: Array.isArray(paths) ? paths : [paths]
  //   })

  return nodegit.Checkout.head(repo, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
    paths: Array.isArray(paths) ? paths : [paths]
  })
}

export async function revertCommit(repo, sha) {
  const fullSHA = (await nodegit.Commit.lookupPrefix(repo, nodegit.Oid.fromString(sha), 8)).sha()
  const oid = nodegit.Oid.fromString(fullSHA)
  const commit = await repo.getCommit(oid)

  const headCommit = await repo.getHeadCommit()

  try {
    const index = await nodegit.Revert.commit(repo, commit, headCommit, 0)
  } catch (e) {
    console.log('ERR:', e)
  }
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} sha
 * @param {String} filePath
 * @returns {Buffer}
 */
export async function getCommitFileContent(repo, sha, filePath) {
  const oid = nodegit.Oid.fromString(sha)
  const commit = await repo.getCommit(oid)
  const entry = await commit.getEntry(filePath)

  if (entry && entry.isFile()) {
    return (await entry.getBlob()).content()
  }
}
