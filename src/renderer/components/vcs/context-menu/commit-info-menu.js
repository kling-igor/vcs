const { remote } = window.require('electron')

export default ({ workspace, notifications }) => sha => {
  workspace.showContextMenu({
    items: [
      {
        label: 'Copy SHA-1 to Clipboard',
        click: () => {
          remote.clipboard.writeText(sha)
          notifications.addInfo('SHA copied to clipboard.')
        }
      }
    ]
  })
}
