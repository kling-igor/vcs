import { openRepository, fetch, push } from './gitops'

const [command, ...args] = process.argv.slice(2)

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
    if (command === 'fetch') {
      await fetchOperation(...args)
      process.send({})
    } else if (command === 'push') {
      await pushOperation(...args)
      process.send({})
    }
  } catch (e) {
    process.send({ error: e.message })
  }

  process.exit(0)
})()
