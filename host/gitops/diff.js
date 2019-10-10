import nodegit from 'nodegit'
import { resolve } from 'path'
import { readFile } from 'fs-extra'

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

  try {
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
  } catch (e) {
    console.log('FILE DIFF ERROR:', e)
    return { details: e }
  }

  return { details: 'ERROR!!!!' }
}

export async function changedFileDiffToIndex(repo, projectPath, filePath) {
  // TODO: а если нет еще коммитов ?

  console.log('fileDiffToHead:', projectPath, filePath)

  let originalContent = ''
  let modifiedContent = ''
  try {
    const index = await repo.index()
    const entry = index.entries().find(item => item.path === filePath)
    if (entry) {
      const blob = await nodegit.Blob.lookup(repo, entry.id)
      const buffer = blob.content()
      originalContent = buffer.toString()
    }

    modifiedContent = await readFile(resolve(projectPath, filePath), { encoding: 'utf-8' })

    return {
      originalContent,
      modifiedContent
    }
  } catch (e) {
    console.log(e)
  }
}

export async function stagedFileDiffToHead(repo, filePath) {
  let originalContent = ''
  let modifiedContent = ''

  try {
    try {
      const headCommit = await repo.getHeadCommit()
      if (headCommit) {
        const originalEntry = await headCommit.getEntry(filePath)
        if (originalEntry && originalEntry.isFile()) {
          originalContent = (await originalEntry.getBlob()).toString()
        }
      }
    } catch (e) {
      console.error('!!!!:', e)
    }

    const index = await repo.index()
    const entry = index.entries().find(item => item.path === filePath)
    if (entry) {
      const blob = await nodegit.Blob.lookup(repo, entry.id)
      const buffer = blob.content()
      modifiedContent = buffer.toString()
    }

    return {
      originalContent,
      modifiedContent
    }
  } catch (e) {
    console.log(e)
  }
}

export async function getMineFileContent(repo, filePath) {
  // const headCommit = await repo.getHeadCommit()
  // const mineEntry = await headCommit.getEntry(filePath)
  // if (mineEntry && mineEntry.isFile()) {
  //   return (await mineEntry.getBlob()).toString()
  // }

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)
  const mineBlob = await repo.getBlob(conflict.our_out.id)
  return mineBlob.toString()
}

export async function getTheirsFileContent(repo, filePath) {
  if (!repo.isMerging()) return

  // const theirsCommit = await repo.getBranchCommit('MERGE_HEAD')
  // const theirsEntry = await theirsCommit.getEntry(filePath)
  // if (theirsEntry && theirsEntry.isFile()) {
  //   return (await theirsEntry.getBlob()).toString()
  // }

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)
  const theirsBlob = await repo.getBlob(conflict.their_out.id)
  return theirsBlob.toString()
}
