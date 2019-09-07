const { remote } = window.require('electron')
const noop = () => {}
const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace }) => () => {
  const remotes = vcs.remotes

  const getPersistentRemote = operation => async () => {
    try {
      let remoteName

      if (remotes.length === 0) {
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
          await vcs[operation].apply(vcs, [remoteName])
        }
      } else if (remotes.length === 1) {
        await vcs[operation].apply(vcs, [remotes[0].name])
      } else {
        remoteName = await workspace.showQuickPick({
          items: remotes.map(item => ({ label: item.name, detail: item.url })),
          placeHolder: 'Remote'
        })

        if (remoteName) {
          await vcs[operation].apply(vcs, [remoteName])
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getRemote = operation => async () => {
    const remoteUrl = await workspace.showInputBox({
      placeHolder: 'Remote URL',
      validateInput: input => GIT_ADDR_REGEX.test(input)
    })

    if (remoteUrl) {
      vcs[operation].apply(vcs, [remoteUrl])
    }
  }

  workspace.showContextMenu({
    items: [
      {
        label: `Fetch`,
        click: getPersistentRemote('fetch')
      },
      {
        label: `Fetch from...`,
        click: getRemote('fetch')
      },
      {
        label: `Pull`,
        click: getPersistentRemote('pull')
      },
      {
        label: `Pull from...`,
        click: getRemote('pull')
      },
      {
        label: `Push`,
        click: getPersistentRemote('push')
      },
      {
        label: `Push to...`,
        click: getRemote('push')
      }
    ]
  })
}
