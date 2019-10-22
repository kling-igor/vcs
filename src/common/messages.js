export const VCS_INIT_REPOSITORY = 'vcs:init.repository'
export const VCS_CLONE_REPOSITORY = 'vcs:clone.repository'
export const VCS_OPEN_REPOSITORY = 'vcs:open.repository'
export const VCS_CLOSE_REPOSITORY = 'vcs:close.repository'

export const VCS_SET_USER_DEFAULTS = 'vcs.set.user-defaults'

export const VCS_GET_LOG = 'vcs:get.log'

export const VCS_FETCH = 'vcs:fetch'
export const VCS_PUSH = 'vcs:push'

export const VCS_ADD_REMOTE = 'vcs:add.remote'
export const VCS_DELETE_REMOTE = 'vcs:delete.remote'

export const VCS_CREATE_BRANCH = 'vcs:create.branch'
export const VCS_DELETE_BRANCH = 'vcs:delete.branch'

export const VCS_CREATE_TAG = 'vcs:create.tag'
export const VCS_DELETE_TAG = 'vcs:delete.tag'

export const VCS_GET_STASHES = 'vcs:get.stashes'
export const VCS_SAVE_STASH = 'vcs:save.stash'
export const VCS_APPLY_STASH = 'vcs:apply.stash'
export const VCS_DROP_STASH = 'vcs:drop.stash'

export const VCS_GET_REPOSITORY_STATUS = 'vcs:get.repository-status'
export const VCS_GET_HEAD_BRANCH = 'vcs:get.head-branch'
export const VCS_GET_REPOSITORY_REFS = 'vcs:get.repository-refs'
export const VCS_GET_COMMIT_DETAILS = 'vcs:get.commit-details'
export const VCS_GET_COMMIT_DIGEST = 'vcs:get.commit-digest'
export const VCS_GET_COMMIT_INDEX = 'vcs:get.commit-index'

export const VCS_CREATE_COMMIT = 'vcs:create.commit'
export const VCS_REVERT_COMMIT = 'vcs:revert.commit'

export const VCS_RESET_COMMIT_HARD = 'vcs:reset.commit-hard'
export const VCS_RESET_COMMIT_MIXED = 'vcs:reset.commit-mixed'
export const VCS_RESET_COMMIT_SOFT = 'vcs:reset.commit-soft'

export const VCS_ADD_TO_STAGE = 'vcs:add.to.stage'
export const VCS_REMOVE_FROM_STAGE = 'vcs:remove.from.stage'

export const VCS_CHECKOUT_BRANCH = 'vcs:checkout.branch'
export const VCS_CHECKOUT_COMMIT = 'vcs:checkout.commit'
export const VCS_DISCARD_LOCAL_CHANGES = 'vcs:discard.local-changes'

export const VCS_MERGE = 'vcs:merge'
export const VCS_MERGE_BRANCHES = 'vcs:merge.branches'

export const VCS_GET_COMMIT_FILE_BUFFER = 'vcs:get.commit-file-buffer'
export const VCS_GET_INDEX_FILE_BUFFER = 'vcs:get.index-file-buffer'

export const VCS_CREATE_COMMIT_TMP_FILE = 'vcs:create.commit-tmp-file'
export const VCS_CREATE_INDEX_TMP_FILE = 'vcs:create.index-tmp-file'

export const VCS_GET_THEIR_TMP_FILE = 'vcs:get.their-tmp-file'
export const VCS_GET_OUR_TMP_FILE = 'vcs:get.our-tmp-file'

export const VCS_GET_THEIR_FILE_BUFFER = 'vcs:get.their-file-buffer'
export const VCS_GET_OUR_FILE_BUFFER = 'vcs:get.our-file-buffer'

export const VCS_RESOLE_USING_THEIR = 'vcs:resolve.using-their'
export const VCS_RESOLE_USING_OUR = 'vcs:resolve.using-our'
export const VCS_RESOLE_AS_IS = 'vcs:resolve.as-is'

export const VCS_GET_FILE_TYPE = 'vcs:get.file-type'

export const CORE_GET_FILE_BUFFER = 'core:get.file-buffer'
// дубликат функционала!!!
export const CORE_OPEN_FILE = 'core:open.file'
export const CORE_SAVE_FILE = 'core:save.file' // для utf8 только ?
export const CORE_REMOVE_FILE = 'core:remove.file'

export const CORE_REMOVE_TMP_FILES = 'core:remove.tmp-files'

export const PROJECT_OPEN = 'project:open'
export const PROJECT_CLOSE = 'project:close'
export const PROJECT_GET_FILE_TYPE = 'project:get.file-type'
export const PROJECT_CREATE_FOLDER = 'project:create.folder'
export const PROJECT_GET_FILE_BUFFER = 'project:get.file-buffer'
// дубликат функционала
export const PROJECT_OPEN_FILE = 'project:open.file'
export const PROJECT_SAVE_FILE = 'project:save.file' // для utf8 только ?
export const PROJECT_RENAME_FILE = 'project:rename.file'
export const PROJECT_REMOVE_FILE = 'project:remove.file'
export const PROJECT_REMOVE_FOLDER = 'project:remove.folder'
