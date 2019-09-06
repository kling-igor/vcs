import nodegit from 'nodegit'
import { resolve, join, dirname, basename } from 'path'
import { ensureDir, writeFile, readFile } from 'fs-extra'

// export async function addRemote(repo, url) {
//   return nodegit.Remote.create(repo, 'origin', url)
// }

// export async function removeConflictUsingMine(repo, filePath) {
//   const index = await repo.index()
//   const conflict = await index.conflictGet(filePath)

//   const ancestorBlob = await repo.getBlob(conflict.ancestor_out.id)
//   const ancestorContent = ancestorBlob.toString()

//   console.log('ANCESTOR:', ancestorContent)

//   const mineBlob = await repo.getBlob(conflict.our_out.id)
//   const mineContent = mineBlob.toString()

//   console.log('MINE:', mineContent)

//   const theirsBlob = await repo.getBlob(conflict.their_out.id)
//   const theirsContent = theirsBlob.toString()

//   console.log('THEIR:', theirsContent)
// }

// export async function conflictedFileDiff(repo, filePath) {
//   let oursContent = ''
//   let theirsContent = ''

//   try {
//     try {
//       const headCommit = await repo.getHeadCommit()
//       const oursEntry = await headCommit.getEntry(filePath)
//       if (oursEntry && oursEntry.isFile()) {
//         oursContent = (await oursEntry.getBlob()).toString()
//       }

//       const theirsCommit = await repo.getBranchCommit('MERGE_HEAD')
//       const theirsEntry = await theirsCommit.getEntry(filePath)
//       if (theirsEntry && theirsEntry.isFile()) {
//         theirsContent = (await theirsEntry.getBlob()).toString()
//       }
//     } catch (e) {
//       console.error('!!!!:', e)
//     }

//     return {
//       oursContent,
//       theirsContent
//     }
//   } catch (e) {
//     console.log(e)
//   }
// }
