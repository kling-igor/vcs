import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { join, resolve } from 'path'
import * as URL from 'url'
import { openRepository, references, status, log, commitInfo } from './gitops'

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
  if (!sha) {
    console.error('sha not specified')
    return null
  }

  if (!repo) {
    console.log('repo is not opened')
    return null
  }

  return commitInfo(repo, sha)
})

answerRenderer('commit:file-diff', async (browserWindow, sha, filePath) => {
  if (!sha) {
    console.error('sha not specified')
    return null
  }

  if (!repo) {
    console.log('repo is not opened')
    return null
  }

  return fileDiffToParent(repo, sha, filePath)
})

const disposable = answerRenderer('gitlog', async browserWindow => {
  if (!repo) {
    console.log('repo is not opened')
    return null
  }

  return log(repo)
})
