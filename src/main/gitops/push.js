import nodegit from 'nodegit'

export async function push(repo, remoteName, branchName, username, password) {
  console.log(`PUSH to remote:${remoteName} branch:${branchName} user:${username} pass:${password}`)

  let attepmpt = 0

  const remoteCallbacks = {
    certificateCheck: () => 0,
    credentials: url => {
      console.log('url:', url)
      if (attepmpt++ < 5) {
        return username && password ? nodegit.Cred.userpassPlaintextNew(username, password) : nodegit.Cred.defaultNew()
      }

      throw new Error('auth failed')
    },
    pushTransferProgress: {
      throttle: 200,
      callback: () => {
        console.log('PROGRESS')
      }
    }
  }

  const remote = await repo.getRemote(remoteName)

  try {
    try {
      await remote.push([`refs/heads/${branchName}:refs/heads/${branchName}`], {
        callbacks: remoteCallbacks
      })

      let branchRef
      try {
        branchRef = await nodegit.Branch.lookup(repo, branchName, nodegit.Branch.BRANCH.LOCAL)

        try {
          await nodegit.Branch.setUpstream(branchRef, `${remoteName}/${branchName}`)
        } catch (e) {
          console.log('UNABLE TO SET UPSTREAM FOR:', branchName)
        }
      } catch (e) {
        console.log('UNABLE TO FIND BRANCH REF:', e)
      }
    } catch (e) {
      throw e
    }
  } catch (e) {
    console.log('PUSH ERROR:', e)
    if (e.message.includes('unexpected HTTP status code:')) {
      console.log('CHECK CONNECTION...')
      throw new Error('Connection error')
    }

    if (
      e.message.includes('credentials callback returned an invalid cred type') ||
      e.message.includes('Method connect has thrown an error.') ||
      e.message.includes('Method push has thrown an error.')
    ) {
      throw new Error('Auth required')
    }
  }
}
