const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace, Dialog }) => () => {
  const remotes = vcs.remotes

  const getPersistentRemote = async () => {
    console.log('getPersistentRemote')
    if (remotes.length === 0) {
      const remoteName = await workspace.showInputBox({
        defaultValue: 'origin',
        placeHolder: "Remote name (default 'origin')",
        validateInput: input => GIT_REMOTE_REGEX.test(input)
      })

      if (!remoteName) return

      const remoteUrl = await workspace.showInputBox({
        placeHolder: 'Remote URL',
        validateInput: input => GIT_ADDR_REGEX.test(input)
      })

      if (!remoteUrl) return

      try {
        await vcs.addRemote(remoteName, remoteUrl)
        return remoteName
      } catch (e) {
        console.log(e)
      }
    } else if (remotes.length === 1) {
      return remotes[0].name
    } else {
      return await workspace.showQuickPick({
        items: remotes.map(item => ({ label: item.name, detail: item.url })),
        placeHolder: 'Remote'
      })
    }
  }

  const getRemote = async () => {
    return await workspace.showInputBox({
      placeHolder: 'Remote URL',
      validateInput: input => GIT_ADDR_REGEX.test(input)
    })
  }

  const handler = async operation => {
    let userName
    let password

    while (true) {
      try {
        await operation({ userName, password })
        return
      } catch (e) {
        if (e.message === 'Auth required') {
          console.log('AUTH REQUIRED!!!!!')

          try {
            await Dialog.confirmAuthRequired()
          } catch (e) {
            return
          }

          userName = await workspace.showInputBox({
            placeHolder: 'Username (email)',
            validateInput: () => true
          })

          if (!userName) return

          password = await workspace.showInputBox({
            placeHolder: 'Password',
            password: true,
            validateInput: () => true
          })

          if (!password) return
        } else if (e.message === 'Auth failed') {
          // Dialog

          return
        } else if (e.message === 'Connection error') {
          // Dialog
          return
        } else {
        }
      }
    }
  }

  workspace.showContextMenu({
    items: [
      {
        label: `Fetch`,
        click: async () => {
          console.log('FETCH!!!')
          const remoteName = await getPersistentRemote()
          if (!remoteName) return

          await handler(async ({ userName, password } = {}) => {
            console.log('FETCH OPERATION WITH CREDENTIALS', userName, password)
            await vcs.fetch(remoteName, userName, password)
          })
        }
      },
      {
        label: `Fetch from...`,
        click: async () => {
          const remoteName = await getRemote()
          if (remoteName) {
            vcs.fetch(remoteName)
          }
        }
      },
      {
        label: `Pull`
        // click: getPersistentRemote('pull')
      },
      {
        label: `Pull from...`
        // click: getRemote('pull')
      },
      {
        label: `Push`
        // click: getPersistentRemote('push')
      },
      {
        label: `Push to...`
        // click: getRemote('push')
      }
    ]
  })
}
