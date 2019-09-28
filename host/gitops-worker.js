import { openRepository, log } from './gitops'

const [command, ...args] = process.argv.slice(2)

async function gitlog(repoPath) {
  if (!repoPath) throw new Error('Repositiry path not specified')

  const repo = await openRepository(repoPath)
  return log(repo)
}

// и другие операции

;(async () => {
  try {
    if (command === 'gitlog') {
      const history = await gitlog(...args)
      process.send({ log: history })
    }
  } catch (e) {
    process.send({ error: e.message })
  }

  process.exit(0)
})()
