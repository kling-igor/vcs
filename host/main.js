import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import * as URL from 'url'
import nodegit from 'nodegit'

let repo
let revWalk
let repoRefs = []

app.on('ready', async () => {
  const window = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1024,
    height: 768,
    backgroundColor: '#fff',
    show: false,
    // icon: process.platform === 'linux' && join(__dirname, 'icons', 'icons', '64x64.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })

  window.loadURL(
    URL.format({
      pathname: join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
      // hash
    })
  )

  window.once('ready-to-show', () => {
    window.webContents.openDevTools()
    window.show()
  })

  window.on('closed', () => {
    window.removeAllListeners()
  })

  try {
    repo = await nodegit.Repository.open(resolve('/Users/user/projects/editor/.git'))

    try {
      const commit = await repo.getHeadCommit()
      revWalk = repo.createRevWalk()
      revWalk.sorting(nodegit.Revwalk.SORT.TOPOLOGICAL)
      revWalk.push(commit.sha())
    } catch (e) {
      console.log('unable to get head commit')
    }
  } catch (e) {
    console.log('unable to open repo:', e)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

answerRenderer('commit:info', async (browserWindow, sha) => {
  const oid = nodegit.Oid.fromString(sha)
  try {
    const commit = await repo.getCommit(oid)

    const paths = []

    const diffList = await commit.getDiff()
    for (const diff of diffList) {
      const patches = await diff.patches()
      for (const patch of patches) {
        paths.push({ old: patch.oldFile().path(), new: patch.newFile().path() })
        // const hunks = await patch.hunks()
        // for (const hunk of hunks) {
        // console.log('----------------------------------------------------------')
        // console.log('diff', patch.oldFile().path(), patch.newFile().path())
        // console.log(hunk.header().trim())
        // const lines = await hunk.lines()
        // for (const line of lines) {
        // console.log(String.fromCharCode(line.origin()) + line.content().trim())
        // }
        // }
      }
    }

    try {
      // const tree = await commit.getTree()

      for (const { old: oldPath, new: newPath } of paths) {
        // console.log('newPath:', newPath)
        const entry = await commit.getEntry(oldPath)
        const blob = await entry.getBlob()
        console.log(`${entry.name()}:${blob.rawsize()} bytes`)
        // console.log(blob.toString())

        // const entry = await tree.getEntry(newPath)
        // entry.getBlob((error, blob) => {
        //   if (error) {
        //     console.log('get blob error:', error)
        //   } else {
        //     console.log('Blob size:', blob.size())
        //   }
        // })
      }
    } catch (e) {
      console.log('TREE ERROR:', e)
    }

    const labels = repoRefs.filter(item => item.sha === sha).map(({ name }) => name)

    return {
      commit: commit.toString(),
      author: {
        name: commit.author().name(),
        email: commit.author().email()
      },
      date: commit.time(),
      message: commit.message(),
      parents: commit.parents().map(parent => parent.toString()),
      labels
    }
  } catch (e) {
    console.log('COMMIT INFO ERROR:', e)
  }

  return null
})

// ipcMain.on('gitlog', async (event, limit) => {
//   console.log('gitlog:', limit)
//   const result = await walk(limit, [])
//   console.log('RESULT:', result)
//   event.reply('gitlog', result)
// })
const disposable = answerRenderer('gitlog', async browserWindow => {
  let branchIndex = 0
  const reserve = []
  const branches = {}

  const commiters = []
  const commits = []

  const getBranch = sha => {
    if (branches[sha] == null) {
      branches[sha] = branchIndex
      reserve.push(branchIndex)
      branchIndex += 1
    }

    return branches[sha]
  }

  const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])

  try {
    const refs = await repo.getReferenceNames(nodegit.Reference.TYPE.LISTALL)
    try {
      for (const refName of refs) {
        const reference = await repo.getReference(refName)
        if (reference.isConcrete()) {
          console.log('Concrete reference:', refName, reference.target().toString())

          const name = refName.replace('refs/heads/', '').replace('refs/remotes/', '')
          repoRefs.push({
            name,
            sha: reference.target().toString()
          })
        } else if (reference.isSymbolic()) {
          console.log('Symbolic reference:', refName, reference.symbolicTarget().toString())
        }
      }
    } catch (e) {
      console.log('unable to get reference info:', e)
    }
  } catch (e) {
    console.log('UNABLE TO GET REFS')
  }

  const walk = async () => {
    // console.log('walk:', limit)

    try {
      const oid = await revWalk.next()
      if (oid) {
        const commit = await repo.getCommit(oid)

        const authorName = commit.author().name()
        const authorEmail = commit.author().email()
        const authorDate = commit.time()

        let commiterIndex

        const foundIndex = commiters.findIndex(({ name, email }) => name === authorName && email === authorEmail)
        if (foundIndex !== -1) {
          commiterIndex = foundIndex
        } else {
          commiterIndex = commiters.length
          commiters.push({ name: authorName, email: authorEmail })
        }

        const sha = commit.toString()
        let message = commit.message()
        if (message.length > 80) {
          message = message.slice(0, 79) + '\u2026'
        }
        const parents = commit.parents().map(parent => parent.toString())
        const [parent, otherParent] = parents

        const branch = getBranch(sha)
        const offset = reserve.indexOf(branch)
        let routes = []

        if (parents.length === 1) {
          if (branches[parent] != null) {
            // create branch
            routes = [
              ...fillRoutes(i => i + offset + 1, i => i + offset + 1 - 1, reserve.slice(offset + 1)),
              ...fillRoutes(i => i, i => i, reserve.slice(0, offset))
            ]

            reserve.splice(reserve.indexOf(branch), 1)
            routes = [...routes, [offset, reserve.indexOf(branches[parent]), branch]]
          } else {
            // straight
            routes = [...fillRoutes(i => i, i => i, reserve)]
            branches[parent] = branch
          }
        } else if (parents.length === 2) {
          // merge branch
          branches[parent] = branch

          routes = fillRoutes(i => i, i => i, reserve)

          const otherBranch = getBranch(otherParent)

          routes = [...routes, [offset, reserve.indexOf(otherBranch), otherBranch]]
        }

        commits.push({
          sha,
          message: message.slice(0, 80),
          commiter: commiterIndex,
          date: authorDate,
          offset,
          branch,
          routes
        })

        // console.log(message.slice(0, 80))

        if (parents.length > 0) {
          return await walk()
        } else {
          return {
            branches: repoRefs,
            commits,
            commiters
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  return await walk()
})
