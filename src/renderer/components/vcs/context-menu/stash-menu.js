const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => (index, message) => {
  console.log('STASH MENU PARAM:', index, message)

  const { stashes, hasLocalChanges, pendingOperation } = vcs

  // const stash = stashes.find(item => item.sha === sha)

  workspace.showContextMenu({
    items: [
      {
        label: `Apply`,
        click: async () => {
          console.log('APPLY STASH')
          try {
            const deleteAfterApply = await Dialog.confirmApplyStash(message)

            const result = await vcs.applyStash(index)

            if (result === 0) {
              if (deleteAfterApply) {
                await vcs.dropStash(index)
                await vcs.getStashes()
              }
            } else {
              console.log('UNABLE TO APPLY STASH (possible WD is not clean or merge conflicts)', result)
            }
          } catch (e) {}
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
