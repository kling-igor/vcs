import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import * as URL from 'url'
import {
  findConfig,
  openRepoConfig,
  userNameEmail,
  openRepository,
  references,
  status,
  refreshIndex,
  writeIndex,
  addToIndex,
  removeFromIndex,
  log,
  commit,
  commitInfo,
  resetToCommit,
  checkoutToCommit,
  headCommit
} from './gitops'

let repo
let emptyRepo = false
let user

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

    let config = await findConfig()
    if (!config) {
      config = await openRepoConfig(repo)
    }

    if (config) {
      const { name, email } = (await userNameEmail(config)) || {}
      if (name && email) {
        user = { name, email }

        console.log('USER:', user)
      }
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

  return await references(repo)
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

answerRenderer('commit:file-diff', async (browserWindow, sha, filePath) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return fileDiffToParent(repo, sha, filePath)
})

const disposable = answerRenderer('gitlog', async browserWindow => {
  checkRepo()

  return log(repo)
})
