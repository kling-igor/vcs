const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, notifications, Dialog }) => (index, message) => {
  workspace.showContextMenu({
    items: [
      {
        label: `Apply`,
        click: async () => {
          console.log('APPLY STASH')
          try {
            const deleteAfterApply = await Dialog.confirmApplyStash(message)
            await vcs.applyStash(index, deleteAfterApply)
            await vcs.getStashes()
          } catch (e) {
            if (e.message === 'Merge conflict') {
              notifications.addError(
                'Your local changes to the files would be overwritten by merge. Please commit your changes or stash them before you merge.'
              )
            }
          }
        }
      },
      {
        label: `Delete`,
        click: async () => {
          console.log('DELETE STASH')

          try {
            await Dialog.confirmStashDeletion(message)

            await vcs.dropStash(index)
            await vcs.getStashes()
          } catch (e) {}
        }
      }
    ]
  })
}
