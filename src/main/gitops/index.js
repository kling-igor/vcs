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

export {
  refreshIndex,
  addToIndex,
  removeFromIndex,
  writeIndex,
  removeConflict,
  discardIndexedChanges,
  getIndexedFileContent
} from './stage'

export { push } from './push'

export { getMineFileContent, getTheirsFileContent } from './diff'

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
  revertCommit,
  getCommitFileContent
} from './commit'
