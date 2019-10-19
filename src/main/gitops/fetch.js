import nodegit from 'nodegit'

// TODO: нужно предоставлять выбор ветки которую нужно тянуть
// делать это через контекстное меню веток

export async function fetch(repo, remoteName, username, password) {
  console.log('FETCH...')

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
    await remote.connect(nodegit.Enums.DIRECTION.FETCH, remoteCallbacks)

    const connected = remote.connected()
    console.log('CONNECTED:', connected)

    const remoteRefs = await remote.referenceList()
    console.log('REMOTE BRANCHES:', remoteRefs.map(item => item.name()))

    await remote.download(null)

    const defaultBranch = await remote.defaultBranch()
    console.log('defaultBranch:', defaultBranch)

    await remote.disconnect()
  } catch (e) {
    console.log('CONNECT ERROR:', e.message)

    if (e.message.includes('unexpected HTTP status code:')) {
      console.log('CHECK CONNECTION...')
      throw new Error('Connection error')
    }

    if (
      e.message.includes('credentials callback returned an invalid cred type') ||
      e.message.includes('Method connect has thrown an error.')
    ) {
      console.log('AUTH REQUIRED')
      throw new Error('Auth required')
    }
  }

  attepmpt = 0

  try {
    console.log('FETCHING!!!!')
    await repo.fetch(remoteName, {
      downloadTags: 1,
      prune: 1,
      updateFetchhead: 1,
      fetchOpts: {
        callbacks: remoteCallbacks
      }
    })
  } catch (e) {
    console.log('FETCH ERROR:', e)
    if (e.message.includes('unexpected HTTP status code:')) {
      console.log('CHECK CONNECTION...')
      throw new Error('Connection error')
    }

    if (
      e.message.includes('credentials callback returned an invalid cred type') ||
      e.message.includes('Method connect has thrown an error.')
    ) {
      console.log('AUTH REQUIRED')
      throw new Error('Auth required')
    }
  }
}
