import { openRepository, log, fetch } from './gitops'

const [command, ...args] = process.argv.slice(2)

async function gitlog(repoPath) {
  if (!repoPath) throw new Error('Repositiry path not specified')

  const repo = await openRepository(repoPath)
  return log(repo)
}

async function fetch(repoPath, remoteName, userName, password) {
  if (!repoPath) throw new Error('Repositiry path not specified')

  const repo = await openRepository(repoPath)
  return fetch(repo, remoteName, userName, password)
}

// и другие операции

;(async () => {
  try {
    if (command === 'gitlog') {
      const history = await gitlog(...args)
      process.send({ log: history })
    } else if (command === 'fetch') {
      await fetch(...args)
      process.send({ fetch: 'done' })
    }
  } catch (e) {
    process.send({ error: e.message })
  }

  process.exit(0)
})()
