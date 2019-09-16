const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace, Dialog }) => () => {
  const { remotes, heads } = vcs

  const getPushingBranch = async () => {
    return await workspace.showQuickPick({
      items: heads.map(item => ({ label: item.name, detail: item.url })),
      placeHolder: 'Branch to push'
    })
  }

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
        console.log('OP ERROR:', e)

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
            await vcs.fetch(remoteName, userName, password)
          })

          console.log('DONE')
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
        label: `Pull`,
        // click: getPersistentRemote('pull')
        click: async () => {
          console.log('PULL!!!')

          const remoteName = await getPersistentRemote()
          if (!remoteName) return

          if (vcs.hasLocalChanges) {
            try {
              await Dialog.confirmPull()
            } catch (e) {
              return
            }
          }

          await handler(async ({ userName, password } = {}) => {
            await vcs.pull(remoteName, userName, password)
          })

          console.log('DONE')
        }
      },
      {
        label: `Pull from...`
        // click: getRemote('pull')
      },
      {
        label: `Push`,
        click: async () => {
          console.log('PUSH!!!')

          if (heads.length === 0) return

          const branch = await getPushingBranch()
          if (!branch) return

          const remoteName = await getPersistentRemote()
          if (!remoteName) return

          console.log('remoteName:', remoteName)

          await handler(async ({ userName, password } = {}) => {
            await vcs.push(remoteName, branch, userName, password)
          })

          console.log('DONE')
        }
      },
      {
        label: `Push to...`
        // click: getRemote('push')
      }
    ]
  })
}
