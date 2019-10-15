const { remote } = window.require('electron')

function confirmActionMessage({ message, detail, option, checked = false, acceptButton, dismissButton }) {
  return new Promise((resolve, reject) => {
    remote.dialog.showMessageBox(
      {
        type: 'question',
        message,
        detail,
        buttons: [acceptButton || 'OK', dismissButton || 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        checkboxLabel: option,
        checkboxChecked: checked
      },
      (index, checkboxChecked) => {
        if (index === 0) {
          if (option) {
            resolve(checkboxChecked)
          } else {
            resolve()
          }
        } else {
          reject()
        }
      }
    )
  })
}

function confirmInfoMessage({ message, detail, option, type = 'info', checked = false, acceptButton }) {
  return new Promise((resolve, reject) => {
    remote.dialog.showMessageBox(
      {
        type,
        message,
        detail,
        buttons: [acceptButton || 'OK'],
        defaultId: 0,
        checkboxLabel: option,
        checkboxChecked: checked
      },
      (_, checkboxChecked) => {
        resolve(checkboxChecked)
      }
    )
  })
}

export function confirmStageFile() {
  const message = 'Confirm Stage?'
  const detail = 'Are you sure you want to add these changes to the index?'
  return confirmActionMessage({ message, detail })
}

export function confirmUnstageFile() {
  const message = 'Confirm Unstage?'
  const detail = 'Are you sure you want to remove these changes from this index?'
  return confirmActionMessage({ message, detail })
}

export function confirmFileRemove(filepath) {
  const message = 'Confirm Remove?'
  const detail = `The following file will be removed from the version control: ${filepath}`
  return confirmActionMessage({ message, detail })
}

export function confirmFileRemoveUntracked(filepath) {
  const message = 'Confirm Remove Modified or Untracked File?'
  const detail = `The following file contains changes or information which in not in source control, and will be irretrievably lost if you remove them: ${filepath}`
  return confirmActionMessage({ message, detail })
}

export function confirmFileStopTracking(filepath) {
  const message = 'Stop Tracking File?'
  const detail = `The following file will be removed from the version control but will remain on your disk: ${filepath}`
  return confirmActionMessage({ message, detail })
}

export function confirmDiscardFileChanges(filepath) {
  const message = 'Discard Changes?'
  const detail = `Are you sure you want to discard all your changes to the following file: ${filepath}`
  return confirmActionMessage({ message, detail })
}

export function confirmBranchSwitch(branch, hasLocalChanges) {
  const message = 'Confirm Branch Switch'
  const detail = `Are you sure you want to switch your working copy to the branch '${branch}'?`
  const option = 'Discard local changes'
  return confirmActionMessage({ message, detail, option: hasLocalChanges ? option : null })
}

export function confirmCheckoutToDetachedHead(tagOrSha, hasLocalChanges) {
  const message = 'Confirm Change Working Copy'
  const detail = `Are you sure you want to checkout ${tagOrSha}? Doing so will make your working copy a 'detached HEAD', which means you won't be on a branch anymore. If you want to commit after this you'll probably want either checkout a branch again, or create a new branch. Is this ok?`
  const option = 'Discard local changes'
  return confirmActionMessage({ message, detail, option: hasLocalChanges ? option : null })
}

export function confirmBranchMerge() {
  const message = 'Confirm Merge'
  const detail = `Are you sure you want to merge into your current branch?`
  const option = 'Commit merged changes immediately'
  return confirmActionMessage({ message, detail, option })
}

export function confirmMergeConflicts() {
  const message = 'Merge Conflicts'
  const detail = `You now have merge conflicts in your working copy that need to be resolved before continuing. You can do this by selecting the conflicted files and using the options under the 'Resolve Conflict' menu.`
  const option = 'Do not show this message again'
  return confirmInfoMessage({ message, detail, option })
}

export function confirmResolveConflictsUsingMine(filepath) {
  const message = `Confirm Resolve Using 'Mine'`
  const detail = `Are you sure you want to resolve the following files using your own version? ${filepath}`
  return confirmInfoMessage({ message, detail })
}

export function confirmResolveConflictsUsingTheirs(filepath) {
  const message = `Confirm Resolve Using 'Theirs'`
  const detail = `Are you sure you want to resolve the following files using the version from the other side of the merge? ${filepath}`
  return confirmInfoMessage({ message, detail })
}

export function confirmMarkResolved(filepath) {
  const message = `Confirm Mark Resolved`
  const detail = `Are you sure you wish to mark the following file as resolved? ${filepath}`
  return confirmInfoMessage({ message, detail })
}

export function confirmMarkUnresolved(filepath) {
  const message = `Confirm Mark Unresolved`
  const detail = `Are you sure you wish to mark the following file as unresolved? ${filepath}`
  return confirmInfoMessage({ message, detail })
}

export function confirmBranchRebase(branch) {
  const message = 'Confirm Rebase'
  const detail = `Are you sure you want to rebase your current changes on to '${branch}' branch? Make sure your changes have not been pushed to anyone else.`
  return confirmActionMessage({ message, detail })
}

export function confirmBranchDelete(branch) {
  const message = 'Confirm Branch Deletion'
  const detail = `Are you sure you want to delete the branch '${branch}'?`
  const option = 'Delete remote branch'
  return confirmActionMessage({ message, detail, option })
}

export function confirmTagDelete(tag) {
  const message = 'Confirm Remove Tag'
  const detail = `Are you sure you want to remove '${tag}' tag?`
  const option = 'Remove tag from all remotes'
  return confirmActionMessage({ message, detail, option })
}

export function confirmSoftBranchPointerReset(branch) {
  const message = 'Confirm Branch Soft Reset'
  const detail = `Are you sure you want to move '${branch}' branch pointer? All local changes will be keep. Is this ok?`
  return confirmActionMessage({ message, detail })
}

export function confirmMixedBranchPointerReset(branch) {
  const message = 'Confirm Branch Mixed Reset'
  const detail = `Are you sure you want to move '${branch}' branch pointer? Working copy will be keep but staged changes will be lost. Is this ok?`
  return confirmActionMessage({ message, detail })
}

export function confirmHardBranchPointerReset(branch) {
  const message = 'Confirm Branch Hard Reset'
  const detail = `Are you sure you want to move '${branch}' branch pointer? This will discard all your local changes in the working copy and the index. Are you sure this is what you want?`
  return confirmActionMessage({ message, detail })
}

export function confirmBackout() {
  const message = 'Confirm Backout'
  const detail = `Are you sure you want to reverse the selected changes?`
  return confirmActionMessage({ message, detail })
}

export function confirmRemoveRemote() {
  const message = 'Confirm Remove Remote'
  const detail = `Are you sure you want to remove the selected remote from the configuration for this repository?`
  return confirmActionMessage({ message, detail })
}

export function confirmAuthRequired() {
  const message = `Remote Auth Required`
  const detail = `You have to specify remote credentials to proceed. Do you wish to continue?`
  return confirmActionMessage({ message, detail })
}

export function confirmPull() {
  const message = 'Confirm Pull'
  const detail = `Working directory contains uncommitted changes. Please commit your changes or stash them before pull otherwise they will be deleted. Do you wish to continue?`
  return confirmActionMessage({ message, detail })
}

export function confirmEnterUserDetails() {
  const message = "Can't commit because your name is not configured"
  const detail = 'You have to enter the user details you wish to associate with your commits'
  const option = 'Use entered details for all repositories '
  return confirmActionMessage({ message, detail, option, acceptButton: 'Proceed' })
}

// Please commit your changes or stash them before
