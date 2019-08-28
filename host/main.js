import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import { EventEmitter } from 'events'
import { CompositeDisposable } from 'event-kit'
import { FileSystemOperations } from './file-operations'
import * as URL from 'url'
import {
  findConfig,
  openRepoConfig,
  getUserNameEmail,
  getRemotes,
  openRepository,
  getReferences,
  status,
  refreshIndex,
  writeIndex,
  addToIndex,
  removeFromIndex,
  log,
  commit,
  commitInfo,
  fileDiffToParent,
  resetToCommit,
  checkoutToCommit,
  headCommit,
  pull,
  push
} from './gitops'

let repo
let emptyRepo = false
let user
let remotes = []

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
    repo = await openRepository(path)
    if (repo) {
      console.log('repo is opened')
    }

    const result = {}

    let config = await findConfig()
    if (!config) {
      config = await openRepoConfig(repo)
    }

    if (config) {
      try {
        const { name, email } = (await getUserNameEmail(config)) || {}
        if (name && email) {
          user = { name, email }

          result.user = user

          console.log('USER:', user)
        }
      } catch (e) {
        console.log('UNABLE TO GET user name and email')
      }

      try {
        remotes = await getRemotes(repo)
        result.remotes = remotes
      } catch (e) {
        console.log('UNABLE TO GET REMOTES INFO', e)
      }

      return result
    }
  } catch (e) {
    console.log('ERROR OPENING REPO:', e)
  }
})

answerRenderer('repository:close', async (browserWindow, path) => {
  repo = null
})

const checkRepo = () => {
  if (!repo) {
    throw new Error('REPO IS NOT OPENED')
  }
}

// TODO add codes for state rebase and merge
answerRenderer('repository:get-status', async browserWindow => {
  checkRepo()

  return await status(repo)
})

answerRenderer('repository:get-head', async browserWindow => {
  checkRepo()

  return await headCommit(repo)
})

answerRenderer('repository:get-references', async browserWindow => {
  checkRepo()

  return await getReferences(repo)
})

answerRenderer('commit:get-info', async (browserWindow, sha) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return commitInfo(repo, sha)
})

answerRenderer('commit:create', async (browserWindow, message) => {
  console.log('commit:create ', message)

  checkRepo()

  // ПОКА ДОБАВИМ В ИНДЕКС ВСЕ ИЗМЕНЕННЫЕ ФАЙЛЫ!!!

  try {
    const index = await refreshIndex(repo)

    const items = await status(repo)
    for (const { path, status } of items) {
      if (status === 'M' || status === 'A' || status === 'R' || status === 'D') {
        await addToIndex(index, path)
      }
    }

    const treeOid = await writeIndex(index)
    await commit(repo, treeOid, message, user.name, user.email)
  } catch (e) {
    console.log('COMMIT ERROR:', e)
  }
})

answerRenderer('repository:checkout', async (browserWindow, sha) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return checkoutToCommit(repo, sha)
})

answerRenderer('repository:pull', async (browserWindow, username, password) => {
  checkRepo()

  return pull(repo, username, password)
})

answerRenderer('repository:push', async (browserWindow, username, password) => {
  checkRepo()
  const remote = await repo.getRemote('origin')
  return push(remote, username, password)
})

answerRenderer('commit:file-diff', async (browserWindow, sha, filePath) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return fileDiffToParent(repo, sha, filePath)
})

answerRenderer('repository:log', async browserWindow => {
  checkRepo()

  return log(repo)
})

/* FAKE APPLICATION (from editor) */

const fileOperations = new FileSystemOperations()

answerRenderer('open-project', (browserWindow, projectPath) => {
  return new Promise((resolve, reject) => {
    fileOperations
      .openProject(projectPath)
      .then(notifier => {
        notifier.on('ready', fileTree => {
          browserWindow.webContents.send('file-tree:ready', fileTree)
        })

        notifier.on('path-add', path => {
          browserWindow.webContents.send('file-tree:path-add', path)
        })

        notifier.on('path-remove', path => {
          browserWindow.webContents.send('file-tree:path-remove', path)
        })

        // notifier.on('path-rename', (src, dst) => {
        //   browserWindow.webContents.send('file-tree:path-rename', src, dst)
        // })

        notifier.on('path-rename', ([source, destination]) => {
          browserWindow.webContents.send('file-tree:path-rename', source, destination)
        })

        notifier.on('path-change', path => {
          browserWindow.webContents.send('file-tree:path-change', path)
        })

        resolve()
      })
      .catch(reject)
  })
})

ipcMain.on('close-project', event => {
  fileOperations.closeProject()
})

answerRenderer('folder-create', (browserWindow, folderPath) => {
  return fileOperations.createFolder(folderPath)
})

answerRenderer('open-file', (browserWindow, filePath) => {
  return fileOperations.openFile(filePath)
})

answerRenderer('save-file', (browserWindow, filePath, buffer) => {
  return fileOperations.saveFile(filePath, buffer)
})

answerRenderer('rename-file', (browserWindow, src, dst) => {
  return fileOperations.rename(src, dst)
})

answerRenderer('remove-file', (browserWindow, path) => {
  return fileOperations.removeFile(path)
})

answerRenderer('remove-folder', (browserWindow, path) => {
  return fileOperations.removeFolder(path)
})
