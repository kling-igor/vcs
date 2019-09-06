import nodegit from 'nodegit'

/**
 * Creates tag on commit
 * @param {Repository} repo
 * @param {{String}} target SHA-1
 * @param {String} tagName
 * @param {String} tagMessage
 */
export async function createTag(repo, target, tagName, name, email, tagMessage) {
  const taggerSignature = nodegit.Signature.now(name, email)

  const oid = nodegit.Oid.fromString(target)
  const commit = await repo.getCommit(oid)

  await nodegit.Tag.create(repo, tagName, commit, taggerSignature, tagMessage, 1)
}

/**
 * Deletes tag
 * @param {Repository} repo
 * @param {String} tagName
 */
export async function deleteTagByName(repo, tagName) {
  await repo.deleteTagByName(tagName)
}
