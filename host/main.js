import { app, BrowserWindow, ipcMain } from 'electron'
const { callRenderer, answerRenderer } = require('./ipc')(ipcMain, BrowserWindow)
import { fork, spawn } from 'child_process'
import { Writable } from 'stream'
import { join, resolve } from 'path'
import { EventEmitter } from 'events'
import { CompositeDisposable, Disposable } from 'event-kit'
import { FileSystemOperations } from './file-operations'
import * as URL from 'url'
import keytar from 'keytar'

import dotenv from 'dotenv'
dotenv.config()

import * as gitops from './gitops'

// FAKE FROM APPLICATION
const fileops = new FileSystemOperations()

let repo
let user
let remotes = []

let gitOpsWorker = null
let gitLogWorker = null

let gitLogResult = null

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
    repo = await gitops.openRepository(path)
    if (repo) {
      console.log('repo is opened')
    }

    const result = {}

    let config = await gitops.findConfig()
    if (!config) {
      config = await gitops.openRepoConfig(repo)
    }

    if (config) {
      try {
        const { name, email } = (await gitops.getUserNameEmail(config)) || {}
        if (name && email) {
          user = { name, email }

          result.user = user

          console.log('USER:', user)
        }
      } catch (e) {
        console.log('UNABLE TO GET user name and email')
      }

      try {
        remotes = await gitops.getRemotes(repo)
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

  return await gitops.status(repo)
})

answerRenderer('repository:get-head', async browserWindow => {
  checkRepo()

  return await gitops.headCommit(repo)
})

answerRenderer('repository:get-references', async browserWindow => {
  checkRepo()

  return await gitops.getReferences(repo)
})

answerRenderer('commit:get-info', async (browserWindow, sha) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return gitops.commitInfo(repo, sha)
})

answerRenderer('commit:create', async (browserWindow, message, mergingCommitSha, name, email) => {
  checkRepo()

  try {
    const index = await repo.index()
    await gitops.writeIndex(index)
    await gitops.commit(repo, message, name, email, mergingCommitSha)
  } catch (e) {
    console.log('COMMIT ERROR:', e)
  }
})

answerRenderer('stage:add', async (browserWindow, paths) => {
  checkRepo()

  try {
    const index = await gitops.refreshIndex(repo)
    for (const path of paths) {
      await gitops.addToIndex(index, path)
    }

    await gitops.writeIndex(index)
  } catch (e) {
    console.log('ERROR ON ADDING TO INDEX', e)
  }
})

answerRenderer('stage:remove', async (browserWindow, paths) => {
  checkRepo()

  try {
    const index = await gitops.refreshIndex(repo)
    for (const path of paths) {
      await gitops.removeFromIndex(index, path)
    }

    await gitops.writeIndex(index)
  } catch (e) {
    console.log('ERROR ON REMOVING FROM INDEX', e)
  }
})

answerRenderer('repository:checkout-branch', async (browserWindow, branch, discardLocalChanges) => {
  checkRepo()
  console.log('CHECKOUT TO BRANCH:', branch, discardLocalChanges)
  return gitops.checkoutBranch(repo, branch, discardLocalChanges)
})

answerRenderer('repository:checkout-commit', async (browserWindow, sha, discardLocalChanges) => {
  checkRepo()
  return gitops.checkoutToCommit(repo, sha, discardLocalChanges)
})

answerRenderer('repository:discard-local-changes', async (browserWindow, projectRoot, path) => {
  checkRepo()
  await gitops.discardLocalChanges(repo, path)

  // const statuses = await status(repo)

  // // новые файлы, не добавленные в индекс, нужно удалять самим
  // const [removingFiles, cleaningFromIndex] = statuses.reduce(
  //   (acc, item) => {
  //     if (item.status.includes('WT_NEW')) {
  //       acc[0].push(resolve(projectRoot, item.path, item.filename))
  //     }

  //     if (item.status.includes('INDEX_DELETED')) {
  //       acc[1].push(resolve(item.path, item.filename))
  //     }

  //     return acc
  //   },
  //   [[], []]
  // )

  // console.log('REMOVING FILES:', removingFiles)

  // for (const path of removingFiles) {
  //   console.log('REMOVE NEW FILE:', path)
  //   try {
  //     await fileops.removeFile(path)
  //   } catch (e) {
  //     console.log('ERROR REMOVING FILE', path, e)
  //   }
  // }

  // const index = await refreshIndex(repo)
  // for (const path of cleaningFromIndex) {
  //   await removeFromIndex(index, path)
  // }
  // await writeIndex(index)

  // await index.clear()
})

answerRenderer('repository:merge', async (browserWindow, theirSha) => {
  console.log('MERGE WITH:', theirSha)
  checkRepo()
  try {
    await gitops.merge(repo, theirSha)
    await gitops.refreshIndex(repo)
  } catch (e) {
    console.log('MERGE ERROR:', e)
  }
})

answerRenderer('repository:merge-branches', async (browserWindow, ourBranchName, theirBranchName) => {
  console.log(`MERGE ${ourBranchName} WITH ${theirBranchName}:`)
  checkRepo()
  try {
    const indexOrCommit = await gitops.mergeBranches(repo, ourBranchName, theirBranchName)
    await gitops.refreshIndex(repo)
  } catch (e) {
    console.log('MERGE ERROR:', e)
  }
})

answerRenderer('commit:file-diff', async (browserWindow, sha, filePath) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return gitops.fileDiffToParent(repo, sha, filePath)
})

answerRenderer('commit:file-diff-to-index', async (browserWindow, projectPath, filePath) => {
  checkRepo()

  return gitops.changedFileDiffToIndex(repo, projectPath, filePath)
})

answerRenderer('commit:stagedfile-diff-to-head', async (browserWindow, filePath) => {
  checkRepo()

  return gitops.stagedFileDiffToHead(repo, filePath)
})

answerRenderer('commit:conflictedfile-diff', async (browserWindow, filePath) => {
  checkRepo()

  // TODO: нужно проверить тип файлов!!!

  const mineContent = await gitops.getMineFileContent(repo, filePath)

  const theirsContent = await gitops.getTheirsFileContent(repo, filePath)

  return {
    mineContent,
    theirsContent
  }
})

// получение информации о коммите для отображения в списке
answerRenderer('commit:digest-info', async (browserWindow, startIndex, endIndex) => {
  return gitLogResult.commits.slice(startIndex, endIndex + 1)
})

answerRenderer('repository:log', async (browserWindow, projectPath) => {
  checkRepo()

  // результат gitlog будет храниться в main

  console.log('GETTING LOG...')

  gitLogResult = await new Promise((resolve, reject) => {
    const writer = new (class extends Writable {
      constructor(opts) {
        super(opts)
        this.data = {}
        this.remain = ''
      }

      _write(chunk, encoding, next) {
        const str = chunk.toString()

        const splitted = str.split('\n')

        if (this.remain && splitted.length > 0) {
          splitted[0] = this.remain + splitted[0]
          this.remain = ''
        }

        const last = splitted.pop()
        // если нет завершающего '\n'
        if (last) {
          this.remain += last
        }
        for (const item of splitted) {
          const trimmed = item.trim()
          if (trimmed) {
            try {
              const obj = JSON.parse(trimmed)

              const { error, log, commit, ref, committer } = obj

              if (log) {
                this.data = log
              } else if (commit) {
                this.data.commits.push(commit)
              } else if (committer) {
                this.data.committers.push(committer)
              } else if (ref) {
                this.data.refs.push(ref)
              } else if (error) {
                reject(error)
              }
            } catch (e) {
              console.log('TRIMMED:', trimmed)
              console.log('ERR:', e)
              reject(e)
            }
          }
        }

        next()
      }
    })()

    gitLogWorker = spawn(process.execPath, [join(__dirname, 'gitlog-worker.js'), projectPath], {
      stdio: ['inherit', 'inherit', 'inherit', 'pipe']
    })

    gitLogWorker.once('close', () => {
      resolve(writer.data)
    })

    gitLogWorker.once('error', reject)

    gitLogWorker.stdio[3].pipe(writer)
  })

  const { commits, ...other } = gitLogResult
  return { log: { ...other, commitsCount: commits.length } }
})

answerRenderer('repository:fetch', async (browserWindow, projectPath, remoteName, userName, password) => {
  checkRepo()

  const remote = await gitops.getRemote(repo, remoteName)

  let name
  let pass

  if (userName && password) {
    await keytar.setPassword(remote.url(), userName, password)

    name = userName
    pass = password
  } else {
    const [record = {}] = await keytar.findCredentials(remote.url())

    name = record.account
    pass = record.password
  }

  if (gitOpsWorker) {
    gitOpsWorker.kill('SIGKILL')
    gitOpsWorker = null
  }

  gitOpsWorker = fork(join(__dirname, 'gitops-worker.js'), ['fetch', projectPath, remoteName, name, pass])

  return await new Promise(resolve => {
    gitOpsWorker.once('message', resolve)
  })
})

answerRenderer('repository:push', async (browserWindow, projectPath, remoteName, branch, userName, password) => {
  checkRepo()

  const remote = await gitops.getRemote(repo, remoteName)

  let name
  let pass

  if (userName && password) {
    await keytar.setPassword(remote.url(), userName, password)

    name = userName
    pass = password
  } else {
    const [record = {}] = await keytar.findCredentials(remote.url())

    name = record.account
    pass = record.password
  }

  if (gitOpsWorker) {
    gitOpsWorker.kill('SIGKILL')
    gitOpsWorker = null
  }

  gitOpsWorker = fork(join(__dirname, 'gitops-worker.js'), ['push', projectPath, remoteName, branch, name, pass])

  return await new Promise(resolve => {
    gitOpsWorker.once('message', resolve)
  })
})

answerRenderer('repository:pull', async (browserWindow, projectPath, remoteName, userName, password) => {
  checkRepo()

  const remote = await gitops.getRemote(repo, remoteName)

  let name
  let pass

  if (userName && password) {
    await keytar.setPassword(remote.url(), userName, password)

    name = userName
    pass = password
  } else {
    const [record = {}] = await keytar.findCredentials(remote.url())

    name = record.account
    pass = record.password
  }

  if (gitOpsWorker) {
    gitOpsWorker.kill('SIGKILL')
    gitOpsWorker = null
  }

  if (!gitOpsWorker) {
    gitOpsWorker = fork(join(__dirname, 'gitops-worker.js'), ['fetch', projectPath, remoteName, name, pass])

    gitOpsWorker.once('message', () => {
      browserWindow.webContents.send('repository:pull')
    })
  }
})

answerRenderer('branch:create', async (browserWindow, name, commit) => {
  checkRepo()

  return gitops.createBranch(repo, name, commit)
})

answerRenderer('branch:delete', async (browserWindow, name) => {
  checkRepo()

  return gitops.deleteBranch(repo, name)
})

answerRenderer('tag:create', async (browserWindow, target, name, message) => {
  checkRepo()

  return gitops.createTag(repo, target, name, user.name, user.email, message)
})

answerRenderer('tag:delete', async (browserWindow, name) => {
  checkRepo()

  return gitops.deleteTagByName(repo, name)
})

answerRenderer('commit:reset-soft', async (browserWindow, sha) => {
  checkRepo()

  return gitops.softResetToCommit(repo, sha)
})

answerRenderer('commit:reset-mixed', async (browserWindow, sha) => {
  checkRepo()

  return gitops.mixedResetToCommit(repo, sha)
})

answerRenderer('commit:reset-hard', async (browserWindow, sha) => {
  checkRepo()

  return gitops.hardResetToCommit(repo, sha)
})

answerRenderer('commit:revert', async (browserWindow, sha) => {
  checkRepo()

  return gitops.revertCommit(repo, sha)
})

answerRenderer('merge:resolve-as-is', async (browserWindow, projectPath, filePath, fileContent) => {
  checkRepo()
  try {
    await fileops.saveFile(join(projectPath, filePath), fileContent)
    await gitops.removeConflict(repo, filePath)

    const index = await gitops.refreshIndex(repo)
    await gitops.addToIndex(index, filePath)
    await gitops.writeIndex(index)
  } catch (e) {
    console.log('RESOLVE AS IS ERROR:', e)
  }
})

answerRenderer('merge:resolve-using-mine', async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    const fileContent = await gitops.getMineFileContent(repo, filePath)
    await fileops.saveFile(join(projectPath, filePath), fileContent)
    await gitops.removeConflict(repo, filePath)

    const index = await gitops.refreshIndex(repo)
    await gitops.addToIndex(index, filePath)
    await gitops.writeIndex(index)
  } catch (e) {
    console.log('RESOLVE USING MINE ERROR:', e)
  }
})

answerRenderer('merge:resolve-using-theirs', async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    const fileContent = await gitops.getTheirsFileContent(repo, filePath)
    await fileops.saveFile(join(projectPath, filePath), fileContent)
    await gitops.removeConflict(repo, filePath)

    const index = await gitops.refreshIndex(repo)
    await gitops.addToIndex(index, filePath)
    await gitops.writeIndex(index)
  } catch (e) {
    console.log('RESOLVE USING THEIRS ERROR:', e)
  }
})

answerRenderer('diff:create-mine-temp-file', async (browserWindow, filePath) => {
  const fileContent = await gitops.getMineFileContent(repo, filePath)
  const tempPath = join('/tmp', filePath)
  await fileops.saveFile(join('/tmp', filePath), fileContent)

  return tempPath
})

answerRenderer('diff:create-theirs-temp-file', async (browserWindow, filePath) => {
  const fileContent = await gitops.getTheirsFileContent(repo, filePath)
  const tempPath = join('/tmp', filePath)
  await fileops.saveFile(tempPath, fileContent)

  return tempPath
})

// WIP!!!!
answerRenderer('diff:create-indexed-temp-file', async (browserWindow, projectPath, filePath) => {
  const fileContent = await gitops.changedFileDiffToIndex(repo, projectPath, filePath)
})

answerRenderer('repository:add-remote', async (browserWindow, name, url) => {
  checkRepo()
  try {
    await gitops.addRemote(repo, name, url)
    return await gitops.getRemotes(repo)
  } catch (e) {}
})

answerRenderer('repository:delete-remote', async (browserWindow, name) => {
  checkRepo()
  try {
    await gitops.deleteRemote(repo, name)
    return await gitops.getRemotes(repo)
  } catch (e) {}
})

answerRenderer('repository:set-user-details', async (browserWindow, userName, email, useForAllRepositories) => {
  let config
  if (useForAllRepositories) {
    config = await gitops.findConfig()
  }
  if (!config && !useForAllRepositories) {
    config = await gitops.openRepoConfig(repo)
  }

  if (!config) return

  await gitops.setUserNameEmail(config, userName, email)
})

answerRenderer('repository:clone', async (browserWindow, remoteUrl, targetFolder, userName, password) => {
  await gitops.cloneRepository(remoteUrl, targetFolder, userName, password)
})

answerRenderer('repository:init', async (browserWindow, folder) => {
  await gitops.createRepository(folder)
})

/* FAKE APPLICATION (from editor) */

answerRenderer('remove-file', (browserWindow, path) => {
  console.log('MAIN: remove-file ', path)
  return fileops.removeFile(path)
})

answerRenderer('open-project', (browserWindow, projectPath) => {
  // return Promise.resolve()
  return new Promise((resolve, reject) => {
    fileops
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
  // fileops.closeProject()
})

answerRenderer('get-file-type', (browserWindow, filePath) => {
  return fileops.getFileType(filePath)
})

answerRenderer('folder-create', (browserWindow, folderPath) => {
  return fileops.createFolder(folderPath)
})

answerRenderer('open-file', (browserWindow, filePath) => {
  return fileops.openFile(filePath)
})

answerRenderer('save-file', (browserWindow, filePath, buffer) => {
  return fileops.saveFile(filePath, buffer)
})

answerRenderer('rename-file', (browserWindow, src, dst) => {
  return fileops.rename(src, dst)
})

answerRenderer('remove-file', (browserWindow, path) => {
  return fileops.removeFile(path)
})

answerRenderer('remove-folder', (browserWindow, path) => {
  return fileops.removeFolder(path)
})
