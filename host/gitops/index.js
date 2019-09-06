export {
  openRepository,
  createRepository,
  cloneRepository,
  status,
  getRemotes,
  getReferences,
  addRemote,
  deleteRemote
} from './repository'

export { findConfig, openRepoConfig, getUserNameEmail } from './config'
export { merge } from './merge'
export { fetch } from './fetch'
export { log } from './log'
export { createBranch, deleteBranch, checkoutBranch, checkoutRemoteBranch } from './branch'
export { createTag, deleteTagByName } from './tag'

export { refreshIndex, addToIndex, removeFromIndex, writeIndex, removeConflict } from './stage'

export { pull } from './pull'

export { push } from './push'

export {
  fileDiffToParent,
  changedFileDiffToIndex,
  stagedFileDiffToHead,
  getMineFileContent,
  getTheirsFileContent
} from './diff'

export {
  commit,
  commitInfo,
  headCommit,
  checkoutToCommit,
  resetToCommit,
  softResetToCommit,
  mixedResetToCommit,
  hardResetToCommit,
  discardLocalChanges,
  revertCommit
} from './commit'
