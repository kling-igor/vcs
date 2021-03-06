const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, notifications, Dialog }) => (sha, tag) => {
  const { heads, hasLocalChanges, pendingOperation } = vcs

  const branch = heads.find(item => item.sha === sha)

  const remotesSubmenu = vcs.remotes.map(item => ({
    label: item.name,
    click: () => {
      console.log('PUSH TAG TO:', item.url)
    }
  }))

  workspace.showContextMenu({
    items: [
      {
        label: `Checkout '${tag}'`,
        click: () => {
          if (branch) {
            Dialog.confirmBranchSwitch(branch.name, hasLocalChanges)
              .then(discardLocalChanges => {
                console.log(`!!SWITCHING TO BRANCH ${branch.name} `)
                vcs.onBranchCheckout(branch.name, discardLocalChanges)
              })
              .catch(noop)
          } else {
            Dialog.confirmCheckoutToDetachedHead(tag, hasLocalChanges)
              .then(discardLocalChanges => {
                console.log(`SWITCHING TO DETACH HEAD ${tag} `)
                vcs.onCheckoutToCommit(sha, discardLocalChanges)
              })
              .catch(noop)
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: `Push to`,
        submenu: remotesSubmenu
      },
      {
        label: `Delete '${tag}'`,
        click: () => {
          Dialog.confirmTagDelete(tag)
            .then(removeFromRemote => {
              console.log(`REMOVING TAG ${tag} AND FROM REMOTE: ${removeFromRemote}`)
              vcs.deleteTag(tag)
            })
            .catch(noop)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy Tag Name to Clipboard',
        click: () => {
          remote.clipboard.writeText(tag)
          notifications.addInfo('Tag name copied to clipboard.')
        }
      }
    ]
  })
}
