const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => sha => {
  const { currentCommit, heads, tags } = vcs

  const branch = heads.find(item => item.sha === sha)
  const tag = tags.find(item => item.sha === sha)

  const remotesSubmenu = vcs.remotes.map(item => ({
    label: item.name,
    click: () => {
      console.log('PUSH TAG TO:', item.url)
    }
  }))

  workspace.showContextMenu({
    items: [
      {
        label: `Checkout ${tag.name}`,
        click: () => {
          if (branch) {
            Dialog.confirmBranchSwitch(branch.name)
              .then(discardLocalChanges => {
                console.log(`!!SWITCHING TO BRANCH ${branch.name} `)
                vcs.onBranchCheckout(branch.name, discardLocalChanges)
              })
              .catch(noop)
          } else {
            Dialog.confirmCheckoutToDetachedHead(tag.name)
              .then(discardLocalChanges => {
                console.log(`SWITCHING TO DETACH HEAD ${tag.name} `)
                vcs.onCheckoutToCommit(tag.sha, discardLocalChanges)
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
        label: `Delete ${tag.name}`,
        click: () => {
          Dialog.confirmTagDelete(tag.name)
            .then(removeFromRemote => {
              console.log(`REMOVING TAG ${name} AND FROM REMOTE: ${removeFromRemote}`)
              vcs.deleteTag(tag.name)
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
          remote.clipboard.writeText(tag.name)
        }
      }
    ]
  })
}
