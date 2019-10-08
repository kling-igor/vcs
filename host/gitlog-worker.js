import { openRepository, log } from './gitops'
import { createWriteStream } from 'fs'

const sendCollection = (collection, stream, key) => {
  return new Promise(resolve => {
    let index = 0

    const intervalHandler = setInterval(() => {
      stream.write(JSON.stringify({ [key]: collection[index] }) + '\n')

      if (index++ >= collection.length) {
        clearInterval(intervalHandler)
        resolve()
      }
    }, 0)
  })
}

;(async () => {
  const [repoPath] = process.argv.slice(2)

  const stream = createWriteStream(null, { fd: 3 })

  try {
    const repo = await openRepository(repoPath)

    const gitlog = await log(repo)

    const { commits, refs, committers, ...other } = gitlog

    // console.log('SENDING MAIN BLOCK...')
    stream.write(JSON.stringify({ log: { ...other, commits: [], refs: [], committers: [] } }))

    // console.log(`SENDING ${refs.length} REFS...`)
    await sendCollection(refs, stream, 'ref')

    // console.log(`SENDING ${committers.length} COMMITTERS...`)
    await sendCollection(committers, stream, 'committer')

    // console.log(`SENDING  ${commits.length} COMMITS...`)
    await sendCollection(commits, stream, 'commit')

    stream.end(() => {
      // console.log('WORKER SENT ALL DATA')
    })
  } catch (e) {
    console.log('WORKER ERROR:', e)
    stream.write(JSON.stringify({ error: e.message }))
  }

  process.exit(0)
})()
