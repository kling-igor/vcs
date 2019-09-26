export {
  openRepository,
  createRepository,
  cloneRepository,
  status,
  getRemotes,
  getReferences,
  addRemote,
  deleteRemote,
  getRemote
} from './repository'

export { findConfig, openRepoConfig, getUserNameEmail, setUserNameEmail } from './config'
export { merge, mergeBranches } from './merge'
export { fetch } from './fetch'
export { log } from './log'
export { createBranch, deleteBranch, checkoutBranch, checkoutRemoteBranch } from './branch'
export { createTag, deleteTagByName } from './tag'

export { refreshIndex, addToIndex, removeFromIndex, writeIndex, removeConflict, discardIndexedChanges } from './stage'

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
