import { openRepository, log } from './gitops'
;(async () => {
  const [repoPath] = process.argv.slice(2)

  try {
    const repo = await openRepository(repoPath)

    const gitlog = await log(repo)

    // тут нужно отдать результат по частям
    // не напрягая Event Loop

    function setImmediatePromise() {
      return new Promise(resolve => {
        setImmediate(() => resolve())
      })
    }

    const { commits, refs, committers, ...other } = gitlog

    console.log('SENDING MAIN BLOCK...')
    process.send({ log: { ...other, commits: [], refs: [], committers: [] } })

    await setImmediatePromise()

    console.log(`SENDING ${refs.length} REFS...`)
    for (const ref of refs) {
      process.send({ ref })
      await setImmediatePromise()
    }

    console.log(`SENDING ${committers.length} COMMITTERS...`)
    for (const committer of committers) {
      process.send({ committer })
      await setImmediatePromise()
    }

    console.log(`SENDING  ${commits.length} COMMITS...`)
    for (const commit of commits.slice(0, 2000)) {
      process.send({ commit })
      await setImmediatePromise()
    }

    console.log('WORKER SENT ALL DATA')
    process.send('DONE')
  } catch (e) {
    process.send({ error: e.message })
  }

  process.exit(0)
})()
