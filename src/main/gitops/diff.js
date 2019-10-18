import nodegit from 'nodegit'

/**
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {Buffer}
 */
export async function getMineFileContent(repo, filePath) {
  if (!repo.isMerging()) return

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)

  if (conflict.our_out) {
    return (await repo.getBlob(conflict.our_out.id)).content()
  }
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {Buffer}
 */
export async function getTheirsFileContent(repo, filePath) {
  if (!repo.isMerging()) return

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)

  if (conflict.their_out) {
    return (await repo.getBlob(conflict.their_out.id)).content()
  }
}
