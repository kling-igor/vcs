import nodegit from 'nodegit'

export async function push(repo, remoteName, branchName, username, password) {
  let attepmpt = 0

  const remoteCallbacks = {
    certificateCheck: () => 0,
    credentials: (url, userName) => {
      if (attepmpt++ < 5) {
        return username && password ? nodegit.Cred.userpassPlaintextNew(username, password) : nodegit.Cred.defaultNew()
      }

      throw new Error('auth failed')
    }
  }

  const remote = await repo.getRemote(remoteName)

  try {
    await remote.push([`refs/heads/${branchName}:refs/heads/${branchName}`], {
      callbacks: remoteCallbacks
    })

    const branchRef = await nodegit.Branch.lookup(repo, branchName, nodegit.Branch.BRANCH.LOCAL)
    await nodegit.Branch.setUpstream(branchRef, `${remoteName}/${branchName}`)
  } catch (e) {
    if (e.message.includes('unexpected HTTP status code:')) {
      console.log('CHECK CONNECTION...')
      throw new Error('Connection error')
    }

    if (e.message.includes('credentials callback returned an invalid cred type')) {
      console.log('AUTH REQUIRED')
      throw new Error('Auth required')
    }

    if (e.message.includes('Method connect has thrown an error.')) {
      console.log('AUTH FAILED')
      throw new Error('Auth failed')
    }

    console.log('UNKNOWN PUSH ERROR:', e.message)
  }
}
