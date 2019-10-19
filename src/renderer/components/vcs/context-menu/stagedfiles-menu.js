const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => filePath => {
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
          console.log('COPYING TO CLIPBOARD:', filePath)
          remote.clipboard.writeText(filePath)
        }
      }
    ]
  })
}
