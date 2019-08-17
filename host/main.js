import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import * as URL from 'url'
import nodegit from 'nodegit'
import { openRepository, references, status } from './gitops'

let repo
let emptyRepo = false

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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

answerRenderer('repository:open', async (browserWindow, path) => {
  try {
    repo = await openRepository(resolve(__dirname, path))
    if (repo) {
      console.log('repo is opened')
    }
  } catch (e) {
    console.log('ERROR OPENING REPO:', e)
  }
})

answerRenderer('repository:close', async (browserWindow, path) => {
  repo = null
})

// TODO add codes for state rebase and merge
answerRenderer('repository:get-status', async browserWindow => {
  if (!repo) {
    console.error('REPO IS NOT OPENED')
    return null
  }

  return await status(repo)
})

answerRenderer('repository:get-references', async browserWindow => {
  if (!repo) {
    console.error('REPO IS NOT OPENED')
    return null
  }

  return await references(repo)
})

answerRenderer('commit:get-info', async (browserWindow, sha) => {
  const oid = nodegit.Oid.fromString(sha)
  try {
    const commit = await repo.getCommit(oid)

    const paths = []

    // получать за один раз такой объем информации - накладно при передаче в рендер
    // TODO: добавить метод получения diff только для одного указанного файла
    // изначально render будет получать только список измененных файлов
    // потом при выделении на файлах будут запрашиваться детали по каждому файлу
    const diffList = await commit.getDiff()
    for (const diff of diffList) {
      const patches = await diff.patches()
      for (const patch of patches) {
        const found = paths.find(
          ({ oldPath, newPath }) => oldPath === patch.oldFile().path() && newPath === patch.newFile().path()
        )
        if (!found) {
          paths.push({ oldPath: patch.oldFile().path(), newPath: patch.newFile().path() })
        }

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
    /*
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
*/

    const repoRefs = await references(repo)

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
      paths,
      labels
    }
  } catch (e) {
    console.log('COMMIT INFO ERROR:', e)
  }

  return null
})

answerRenderer('commit:file-diff', async (browserWindow, sha, path) => {
  if (!sha) {
    console.error('sha not specified')
    return null
  }

  if (!repo) {
    console.log('repo is not opened')
    return null
  }

  const oid = nodegit.Oid.fromString(sha)
  const commit = await repo.getCommit(oid)

  let originalContent = ''
  let modifiedContent = ''

  const [parentSha] = commit.parents()
  if (parentSha) {
    const parentCommit = await repo.getCommit(parentSha)

    const originalEntry = await parentCommit.getEntry(path)

    if (originalEntry && originalEntry.isFile()) {
      originalContent = (await originalEntry.getBlob()).toString()
    }
  }

  const modifiedEntry = await commit.getEntry(path)

  if (modifiedEntry.isFile()) {
    modifiedContent = (await modifiedEntry.getBlob()).toString()

    return {
      originalContent,
      modifiedContent
    }
  }

  return { details: 'ERROR!!!!' }
})

// ipcMain.on('gitlog', async (event, limit) => {
//   console.log('gitlog:', limit)
//   const result = await walk(limit, [])
//   console.log('RESULT:', result)
//   event.reply('gitlog', result)
// })
const disposable = answerRenderer('gitlog', async browserWindow => {
  if (!repo) {
    console.log('repo is not opened')
    return null
  }

  const commit = await repo.getHeadCommit()
  const revWalk = repo.createRevWalk()
  revWalk.sorting(nodegit.Revwalk.SORT.TOPOLOGICAL)
  revWalk.push(commit.sha())

  let branchIndex = 0
  const reserve = []
  const branches = {}

  const commiters = []
  const commits = []

  const getBranch = sha => {
    if (!sha) {
      reserve.push(branchIndex)
      branches[sha] = branchIndex
      return branchIndex
    }

    if (branches[sha] == null) {
      if (branches[null] != null) {
        delete branches[null]
        reserve.shift()
      }

      branches[sha] = branchIndex
      reserve.push(branchIndex)
      branchIndex += 1
    }

    return branches[sha]
  }

  const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])

  const repoRefs = await references(repo)

  const workDirStatus = await status(repo)

  if (workDirStatus.length > 0) {
    const branch = getBranch(null)
    const offset = reserve.indexOf(branch)

    commits.push({
      sha: null,
      message: 'Uncommited changes',
      commiter: null,
      date: Date.now(),
      offset,
      branch,
      routes: [...fillRoutes(i => i, i => i, reserve)]
    })
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
