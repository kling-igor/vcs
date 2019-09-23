const { remote } = window.require('electron')

const noop = () => {}

export default ({ vcs, workspace, Dialog }) => (_, name) => {
  const { remotes, currentBranch, hasLocalChanges } = vcs

  const remotesSubmenu = remotes.map(item => ({
    label: item.name,
    click: () => {
      console.log('PUSH BRANCH TO:', item.url)
    }
  }))

  workspace.showContextMenu({
    items: [
      {
        label: `Checkout '${name}'`,
        click: () => {
          Dialog.confirmBranchSwitch(name, hasLocalChanges)
            .then(discardLocalChanges => {
              console.log(`SWITCHING TO BRANCH ${name} `)
              vcs.onBranchCheckout(name, discardLocalChanges)
            })
            .catch(noop)
        }
      },
      {
        label: `Merge '${name}'`,
        click: () => {
          Dialog.confirmBranchMerge()
            .then(commitImmediatley => {
              console.log(`MERGING INTO CURRENT BRANCH AND COMMITING ${commitImmediatley}`)
            })
            .catch(noop)
        }
      },
      {
        label: `Rebase '${name}'`,
        click: () => {
          Dialog.confirmBranchRebase(name)
            .then(() => {
              console.log('REBASING CURRENT CHANGES TO ', name)
            })
            .catch(noop)
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
        type: 'separator'
      },
      {
        label: `Rename...`,
        click: () => {
          workspace
            .showInputUnique({
              items: remotes.map(({ name: label }) => ({ label })),
              placeHolder: 'New branch name',
              validateInput: input => /^[a-zA-Z0-9\-_]+$/.test(input)
            })
            .then(value => {
              if (value) {
                console.log(`RENAMING BRANCH ${name} TO ${value}`)
              }
            })
            .catch(noop)
        }
      },
      {
        label: `Delete '${name}'`,
        click: () => {
          Dialog.confirmBranchDelete(name)
            .then(deleteRemoteBranch => {
              console.log(`DELETING BRANCH ${name} AND DELETING REMOTE ${deleteRemoteBranch}`)

              vcs.deleteBranch(name).catch(e => {
                console.log('ERROR DELETING BRANCH:', e)
              })
            })
            .catch(noop)
        },
        enabled: currentBranch !== name
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy Branch Name to Clipboard',
        click: () => {
          remote.clipboard.writeText(name)
        }
      }
    ]
  })
}
