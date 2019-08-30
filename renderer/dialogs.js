const { remote } = window.require('electron')
import prompt from 'electron-prompt'

function confirmActionMessage(message, detail, option) {
  return new Promise((resolve, reject) => {
    remote.dialog.showMessageBox(
      {
        type: 'question',
        message,
        detail,
        buttons: ['OK', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        checkboxLabel: option
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

export function confirmStageFile() {
  const message = 'Confirm Stage?'
  const detail = 'Are you sure you want to add these changes to the index?'
  return confirmActionMessage(message, detail)
}

export function confirmUnstageFile() {
  const message = 'Confirm Unstage?'
  const detail = 'Are you sure you want to remove these changes from this index?'
  return confirmActionMessage(message, detail)
}

export function confirmFileRemove(filepath) {
  const message = 'Confirm Remove?'
  const detail = `The following file will be removed from the version control: ${filepath}`
  return confirmActionMessage(message, detail)
}

export function confirmFileStopTracking(filepath) {
  const message = 'Stop tracking file?'
  const detail = `The following file will be removed from the version control but will remain on your disk: ${filepath}`
  return confirmActionMessage(message, detail)
}

export function confirmDiscardFileChanges(filepath) {
  const message = 'Discard changes?'
  const detail = `Are you sure you want to discard all your changes to the following file: ${filepath}`
  return confirmActionMessage(message, detail)
}

export function confirmBranchSwitch(branch) {
  const message = 'Confirm Branch Switch'
  const detail = `Are you sure you want to switch your working copy to the branch '${branch}'?`
  const option = 'Discard local changes'
  return confirmActionMessage(message, detail, option)
}

export function confirmBranchMerge() {
  const message = 'Confirm Merge'
  const detail = `Are you sure you want to merge into your current branch?`
  const option = 'Commit merged changes immediately'
  return confirmActionMessage(message, detail, option)
}

export function confirmBranchRebase(branch) {
  const message = 'Confirm Rebase'
  const detail = `Are you sure you want to rebase your current changes on to '${branch}'? Make sure your changes have not been pushed to anyone else.`
  return confirmActionMessage(message, detail)
}

export function confirmBranchDelete(branch) {
  const message = 'Confirm Branch Deletion'
  const detail = `Are you sure you want to delete the branch '${branch}'?`
  const option = 'Delete remote branch'
  return confirmActionMessage(message, detail, option)
}

export function confirmCheckoutToDetachedHead(tag) {
  const message = 'Confirm Change Working Copy'
  const detail = `Are you sure you want to checkout ${tag}? Doing so will make your working copy a 'detached HEAD', which means you won't be on a branch anymore. If you want to commit after this you'll probably want either checkout a branch again, or create a new branch. Is this ok?`
  const option = 'Discard local changes'
  return confirmActionMessage(message, detail, option)
}

export function confirmTagDelete(tag) {
  const message = 'Confirm Remove Tag'
  const detail = `Are you sure you want to remove ${tag}?`
  const option = 'Remove tag from all remotes'
  return confirmActionMessage(message, detail, option)
}
