import { app, BrowserWindow, ipcMain } from 'electron'
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
    repo = await nodegit.Repository.open(resolve(__dirname, '..', '.git'))

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

const walk = async (limit, result) => {
  try {
    const oid = await revWalk.next()
    if (oid) {
      const commit = await repo.getCommit(oid)
      // console.log(`['${commit.toString()}',`, commit.parents().map(parent => parent.toString()), '],')
      // console.log('COMMIT:', commit)
      console.log('commit:', commit.toString())
      console.log('message:', commit.message())
      console.log('author:', commit.author().name())
      console.log('date:', commit.date())
      console.log('parents:', commit.parents().map(parent => parent.toString()))
      console.log('-----------------------------------------\n')

      result.push(commit)

      if (commit.parents().length > 0 && limit > 0) {
        await walk(limit - 1, result)
      }
    }
  } catch (e) {
    console.log(e)
  }
}

ipcMain.on('gitlog', (event, limit) => {
  console.log('gitlog:', limit)
  const result = []
  walk(limit, result)
  console.log('RESULT:', result)
  event.reply('gitlog', result)
})
