const noop = () => {}
export default ({ vcs, workspace, Dialog }) => name => {
  const { pendingOperation } = vcs

  workspace.showContextMenu({
    items: [
      {
        label: `Remove '${name}'...`,
        click: () => {
          Dialog.confirmRemoveRemote()
            .then(() => {
              console.log(`!!REMOVING REMOTE ${name} `)
              vcs.deleteRemote(name)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      }
    ]
  })
}
