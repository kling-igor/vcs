const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => path => {
  workspace.showContextMenu({
    items: [
      {
        label: `Unstage from index`,
        click: () => {
          Dialog.confirmUnstageFile()
            .then(() => {
              console.log('UNSTAGING ', path)
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
          console.log('COPYING TO CLIPBOARD:', path)
          remote.clipboard.writeText(path)
        }
      }
    ]
  })
}
