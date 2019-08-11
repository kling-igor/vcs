import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import * as URL from 'url'
import nodegit from 'nodegit'

let repo
let revWalk

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
    repo = await nodegit.Repository.open(resolve('/Users/kling/Altarix/editor/.git'))

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

    return {
      commit: commit.toString(),
      author: {
        name: commit.author().name(),
        email: commit.author().email()
      },
      date: commit.time(),
      message: commit.message(),
      parents: commit.parents().map(parent => parent.toString()),
      labels: ['master', 'HEAD'] // TODO:
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
