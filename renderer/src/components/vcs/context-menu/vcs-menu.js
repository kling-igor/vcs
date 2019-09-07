const { remote } = window.require('electron')
const noop = () => {}
const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace }) => () => {
  const remotes = vcs.remotes

  const hasRemotes = remotes.length > 0

  workspace.showContextMenu({
    items: [
      {
        label: `Pull`,
        click: async () => {}
      },
      {
        label: `Push from...`,
        click: () => {
          // показывать список выбора
        }
      },
      {
        label: `Push`,
        click: async () => {
          try {
            if (hasRemotes) {
              const value = await workspace.showQuickPick({
                items: remotes.map(item => ({ label: item.name, detail: item.url })),
                placeHolder: 'Remote'
              })

              if (value) {
                await vcs.push(value)
              }
            } else {
              let remoteName
              let remoteUrl

              try {
                remoteName = await workspace.showInputBox({
                  defaultValue: 'origin',
                  placeHolder: "Remote name (default 'origin')",
                  validateInput: input => GIT_REMOTE_REGEX.test(input)
                })

                if (remoteName) {
                  remoteUrl = await workspace.showInputBox({
                    placeHolder: 'Remote URL',
                    validateInput: input => GIT_ADDR_REGEX.test(input)
                  })
                }
              } catch (e) {}

              if (remoteName && remoteUrl) {
                await vcs.addRemote(remoteName, remoteUrl)
                await vcs.push(remoteName)
              }
            }
          } catch (e) {
            console.log(e)
          }
        }
      },
      {
        label: `Push to...`,
        click: () => {
          // если !hasRemotes - показывать инпутбокс ввода адреса
          // показывать список выбора
        }
      }
    ]
  })
}
