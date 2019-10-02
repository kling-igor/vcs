import { openRepository, log, fetch, push } from './gitops'

const [command, ...args] = process.argv.slice(2)

async function gitlogOperation(repoPath) {
  if (!repoPath) throw new Error('Repository path not specified')

  const repo = await openRepository(repoPath)
  return log(repo)
}

async function fetchOperation(repoPath, remoteName, userName, password) {
  if (!repoPath) throw new Error('Repository path not specified')

  const repo = await openRepository(repoPath)
  return fetch(repo, remoteName, userName, password)
}

async function pushOperation(repoPath, remoteName, branch, userName, password) {
  if (!repoPath) throw new Error('Repository path not specified')

  const repo = await openRepository(repoPath)
  return push(repo, remoteName, branch, userName, password)
}

;(async () => {
  try {
    if (command === 'gitlog') {
      const history = await gitlogOperation(...args)
      // console.log('HISTORY:', history)
      process.send({ log: history })
    } else if (command === 'fetch') {
      await fetchOperation(...args)
      process.send('done')
    } else if (command === 'push') {
      await pushOperation(...args)
      process.send('done')
    }
  } catch (e) {
    process.send({ error: e.message })
  }

  process.exit(0)
})()
