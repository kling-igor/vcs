import { action } from 'mobx'

const GIT_REMOTE_REGEX = /^[a-zA-Z0-9\-_]+$/
const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace }) => () => {
  const { remotes } = vcs

  workspace.showContextMenu({
    items: [
      {
        label: 'Add Remote',
        click: action(async () => {
          let remoteName
          let remoteUrl

          if (remotes.length === 0) {
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
          } else {
            try {
              remoteName = await workspace.showInputUnique({
                items: remotes.map(({ name: label }) => ({ label })),
                placeHolder: 'Remote name',
                validateInput: input => GIT_REMOTE_REGEX.test(input)
              })
              if (remoteName) {
                remoteUrl = await workspace.showInputBox({
                  placeHolder: 'Remote URL',
                  validateInput: input => GIT_ADDR_REGEX.test(input)
                })
              }
            } catch (e) {}
          }

          if (remoteName && remoteUrl) {
            await vcs.addRemote(remoteName, remoteUrl)
          }
        })
      }
    ]
  })
}
