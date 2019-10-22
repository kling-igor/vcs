const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, notifications, Dialog }) => filePath => {
  workspace.showContextMenu({
    items: [
      {
        label: `Unstage from index`,
        click: () => {
          Dialog.confirmUnstageFile()
            .then(() => {
              console.log('UNSTAGING ', filePath)
              vcs.unstageFile(filePath)
            })
            .catch(noop)
        }
      },
      {
        type: 'separator'
      },
      {
        label: `Copy Path to Clipboard`,
        click: () => {
          notifications.addInfo('File path copied to clipboard.')
          remote.clipboard.writeText(filePath)
        }
      }
    ]
  })
}
