import nodegit from 'nodegit'
import { resolve } from 'path'
import { readFile } from 'fs-extra'

// /**
//  * @param {nodegit.Repository} repo
//  * @param {String} sha
//  * @param {String} filePath
//  * @returns {Buffer}
//  */
// async function getCommittedFileContent(repo, sha, filePath) {
//   try {
//     const oid = nodegit.Oid.fromString(sha)
//     const commit = await repo.getCommit(oid)

//     const entry = await commit.getEntry(filePath)

//     if (entry && entry.isFile()) {
//       return await entry.getBlob()
//     }
//   } catch (e) {
//     console.log('Unable to get commited file content', e.message)
//   }
// }

// /**
//  * File current and parent versions
//  * @param {nodegit.Repository} repo
//  * @param {String} sha
//  * @param {String} filePath - file relative path to repository
//  * @returns {{originalContent: String, modifiedContent:String}}
//  */
// export async function fileDiffToParent(repo, sha, filePath) {
//   let originalContent = ''
//   let modifiedContent = ''

//   try {
//     originalContent = (await getCommittedFileContent(repo, sha, filePath)).toString()

//     const oid = nodegit.Oid.fromString(sha)
//     const commit = await repo.getCommit(oid)

//     const [parentSha] = commit.parents()
//     if (parentSha) {
//       modifiedEntry = (await getCommittedFileContent(repo, parentSha, filePath)).toString()
//     }
//     return {
//       originalContent,
//       modifiedContent
//     }
//   } catch (e) {
//     console.log('FILE DIFF ERROR:', e)
//     return { details: e }
//   }

// // const oid = nodegit.Oid.fromString(sha)
// // const commit = await repo.getCommit(oid)

// let originalContent = ''
// let modifiedContent = ''

// try {
//   // const [parentSha] = commit.parents()
//   // if (parentSha) {
//   //   const parentCommit = await repo.getCommit(parentSha)
//   //   const originalEntry = await parentCommit.getEntry(filePath)
//   //   if (originalEntry && originalEntry.isFile()) {
//   //     originalContent = (await originalEntry.getBlob()).toString()
//   //   }
//   // }
//   // originalContent = await getParentCommitContent(repo, sha, filePath)
//   // const modifiedEntry = await commit.getEntry(filePath)
//   // if (modifiedEntry.isFile()) {
//   //   modifiedContent = (await modifiedEntry.getBlob()).toString()
//   //   return {
//   //     originalContent,
//   //     modifiedContent
//   //   }
//   // }
// } catch (e) {
//   console.log('FILE DIFF ERROR:', e)
//   return { details: e }
// }

// return { details: 'ERROR!!!!' }
// }

/**
 *
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {Buffer}
 */
export async function getMineFileContent(repo, filePath) {
  if (!repo.isMerging()) return
  // const headCommit = await repo.getHeadCommit()
  // const mineEntry = await headCommit.getEntry(filePath)
  // if (mineEntry && mineEntry.isFile()) {
  //   return (await mineEntry.getBlob()).toString()
  // }

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)
  return await repo.getBlob(conflict.our_out.id)
  // return mineBlob.toString()
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {Buffer}
 */
export async function getTheirsFileContent(repo, filePath) {
  if (!repo.isMerging()) return

  // const theirsCommit = await repo.getBranchCommit('MERGE_HEAD')
  // const theirsEntry = await theirsCommit.getEntry(filePath)
  // if (theirsEntry && theirsEntry.isFile()) {
  //   return (await theirsEntry.getBlob()).toString()
  // }

  const index = await repo.index()
  const conflict = await index.conflictGet(filePath)
  return await repo.getBlob(conflict.their_out.id)
  // return theirsBlob.toString()
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} projectPath
 * @param {String} filePath
 * @returns {{originalContent:String, modifiedContent:String}}
 */
export async function changedFileDiffToIndex(repo, projectPath, filePath) {
  console.log('fileDiffToHead:', projectPath, filePath)

  let originalContent = ''
  let modifiedContent = ''
  try {
    // const index = await repo.index()
    // const entry = index.entries().find(item => item.path === filePath)
    // if (entry) {
    //   const blob = await nodegit.Blob.lookup(repo, entry.id)
    //   const buffer = blob.content()
    //   originalContent = buffer.toString()
    // }

    const originalContentBuffer = await getIndexedFileContent(repo, filePath)
    if (originalContentBuffer) {
      originalContent = originalContentBuffer.toString()
    }

    originalContent = (await getIndexedFileContent(repo, filePath)).toString()

    modifiedContent = await readFile(resolve(projectPath, filePath), { encoding: 'utf-8' })

    return {
      originalContent,
      modifiedContent
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {{originalContent:String, modifiedContent:String}}
 */
export async function stagedFileDiffToHead(repo, filePath) {
  let originalContent = ''
  let modifiedContent = ''

  try {
    try {
      const headCommit = await repo.getHeadCommit()
      if (headCommit) {
        // const originalEntry = await headCommit.getEntry(filePath)
        // if (originalEntry && originalEntry.isFile()) {
        //   originalContent = (await originalEntry.getBlob()).toString()
        // }
        originalContent = (await getCommittedFileContent(repo, headCommit.sha(), filePath)).toString()
      }
    } catch (e) {
      console.error('!!!!:', e)
    }

    // const index = await repo.index()
    // const entry = index.entries().find(item => item.path === filePath)
    // if (entry) {
    //   const blob = await nodegit.Blob.lookup(repo, entry.id)
    //   const buffer = blob.content()
    //   modifiedContent = buffer.toString()
    // }

    modifiedContent = (await getIndexedFileContent(repo, filePath)).toString()

    return {
      originalContent,
      modifiedContent
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * @param {nodegit.Repository} repo
 * @param {String} filePath
 * @returns {Buffer}
 */
async function getIndexedFileContent(repo, filePath) {
  const index = await repo.index()
  const entry = index.entries().find(item => item.path === filePath)
  if (entry) {
    const blob = await nodegit.Blob.lookup(repo, entry.id)
    return blob.content()
  }
}
