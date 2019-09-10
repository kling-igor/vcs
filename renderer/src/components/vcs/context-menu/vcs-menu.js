import { dialog } from 'electron'

const { remote } = window.require('electron')
const noop = () => {}
const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export default ({ vcs, workspace, Dialog }) => () => {
  const remotes = vcs.remotes

  const getPersistentRemote = async () => {
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
          // await vcs[operation].apply(vcs, [remoteName])
          return remoteName
        }
      } else if (remotes.length === 1) {
        // await vcs[operation].apply(vcs, [remotes[0].name])
        return remotes[0].name
      } else {
        remoteName = await workspace.showQuickPick({
          items: remotes.map(item => ({ label: item.name, detail: item.url })),
          placeHolder: 'Remote'
        })

        // if (remoteName) {
        //   await vcs[operation].apply(vcs, [remoteName])
        // }

        return remoteName
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getRemote = async () => {
    return await workspace.showInputBox({
      placeHolder: 'Remote URL',
      validateInput: input => GIT_ADDR_REGEX.test(input)
    })

    // if (remoteUrl) {
    //   vcs[operation].apply(vcs, [remoteUrl])
    // }
  }

  workspace.showContextMenu({
    items: [
      {
        label: `Fetch`,
        click: async () => {
          const remoteName = await getPersistentRemote()
          if (remoteName) {
            try {
              await vcs.fetch(remoteName)
            } catch (e) {
              console.log('FETCH ERROR:', e)
              if (e.message === 'Auth required') {
                console.log('AUTH REQUIRED!!!!!')

                try {
                  await Dialog.confirmAuthRequired()

                  const userName = await workspace.showInputBox({
                    placeHolder: 'Username (email)',
                    validateInput: () => true
                  })

                  if (userName) {
                    const password = await workspace.showInputBox({
                      placeHolder: 'Password',
                      password: true,
                      validateInput: () => true
                    })

                    if (password) {
                      try {
                        await vcs.fetch(remoteName, userName, password)
                      } catch (e) {
                        console.log('FETCH WITH CREDENTIALS ERROR')
                      }
                    }
                  }
                } catch (e) {}
              } else if (e.message === 'Auth failed') {
              } else if (e.message === 'Connection error') {
              } else {
              }
            }
          }
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
