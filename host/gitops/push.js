import nodegit from 'nodegit'

export async function push(remote, username, password = '') {
  const branch = 'master'

  var sshPublicKeyPath = '/Users/user/.ssh/id_rsa.pub'
  var sshPrivateKeyPath = '/Users/user/.ssh/id_rsa'

  let debug = 0

  try {
    const code = await remote.push([`refs/heads/${branch}:refs/heads/${branch}`], {
      callbacks: {
        // github will fail cert check on some OSX machines, this overrides that check
        certificateCheck: () => 0,
        // credentials: /*username ? (url, userName) => nodegit.Cred.userpassPlaintextNew(username, password) : null,*/
        credentials: (url, userName) => {
          console.log('REMOTE URL:', url)
          return nodegit.Cred.sshKeyFromAgent(userName)

          console.log(`getting creds for url:${url} username:${userName}`)
          // avoid infinite loop when authentication agent is not loaded
          if (debug++ > 10) {
            console.log('Failed too often, bailing.')
            throw 'Authentication agent not loaded.'
          }
          // return nodegit.Cred.sshKeyNew(userName, sshPublicKeyPath, sshPrivateKeyPath, '')
          return nodegit.Cred.sshKeyFromAgent(userName)
        },
        transferProgress: progress => console.log('push progress:', progress)
      }
    })

    console.log('PUSH RESULT CODE:', code)
  } catch (e) {
    console.log('PUSH ERROR:', e)
  }
}
