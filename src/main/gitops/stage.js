// index is reserved for filename

import nodegit from 'nodegit'

/**
 * Refreshes index
 * @param {Repository} repo
 * @returns {Index}
 */
export async function refreshIndex(repo) {
  return repo.refreshIndex()
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
 * Make WT state identical index
 * @param {*} repo
 * @param {*} paths
 */
export async function discardIndexedChanges(repo, index, paths) {
  return nodegit.Checkout.index(repo, index, {
    checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
    paths: Array.isArray(paths) ? paths : [paths]
  })
}

/**
 * Writes to index
 * @param {Index} index
 */
export async function writeIndex(index) {
  await index.write()
}

export async function removeConflict(repo, filePath) {
  const index = await repo.index()
  await index.conflictRemove(filePath)
}

export async function getIndexedFileContent(repo, filePath) {
  const index = await repo.index()
  const entry = index.entries().find(item => item.path === filePath)
  if (entry) {
    const blob = await nodegit.Blob.lookup(repo, entry.id)
    return blob.content()
  }
}
