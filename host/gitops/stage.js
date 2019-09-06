// index is reserved for filename

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
