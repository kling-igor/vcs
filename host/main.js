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

import {
  findConfig,
  openRepoConfig,
  getUserNameEmail,
  setUserNameEmail,
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
  changedFileDiffToIndex,
  stagedFileDiffToHead,
  getMineFileContent,
  getTheirsFileContent,
  softResetToCommit,
  mixedResetToCommit,
  hardResetToCommit,
  revertCommit,
  discardLocalChanges,
  discardIndexedChanges,
  checkoutBranch,
  checkoutToCommit,
  createBranch,
  deleteBranch,
  createTag,
  deleteTagByName,
  headCommit,
  cloneRepository,
  createRepository,
  // pull,
  // push,
  // fetch,
  merge,
  mergeBranches,
  removeConflict,
  addRemote,
  deleteRemote,
  getRemote
} from './gitops'

// FAKE FROM APPLICATION
const fileOperations = new FileSystemOperations()

let repo
let emptyRepo = false
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

answerRenderer('commit:create', async (browserWindow, message, mergingCommitSha, name, email) => {
  checkRepo()

  try {
    const index = await repo.index()
    await writeIndex(index)
    await commit(repo, message, name, email, mergingCommitSha)
  } catch (e) {
    console.log('COMMIT ERROR:', e)
  }
})

answerRenderer('stage:add', async (browserWindow, paths) => {
  checkRepo()

  try {
    const index = await refreshIndex(repo)
    for (const path of paths) {
      await addToIndex(index, path)
    }

    await writeIndex(index)
  } catch (e) {
    console.log('ERROR ON ADDING TO INDEX', e)
  }
})

answerRenderer('stage:remove', async (browserWindow, paths) => {
  checkRepo()

  try {
    const index = await refreshIndex(repo)
    for (const path of paths) {
      await removeFromIndex(index, path)
    }

    await writeIndex(index)
  } catch (e) {
    console.log('ERROR ON REMOVING FROM INDEX', e)
  }
})

answerRenderer('repository:checkout-branch', async (browserWindow, branch, discardLocalChanges) => {
  checkRepo()
  console.log('CHECKOUT TO BRANCH:', branch, discardLocalChanges)
  return checkoutBranch(repo, branch, discardLocalChanges)
})

answerRenderer('repository:checkout-commit', async (browserWindow, sha, discardLocalChanges) => {
  checkRepo()
  return checkoutToCommit(repo, sha, discardLocalChanges)
})

answerRenderer('repository:discard-local-changes', async (browserWindow, projectRoot, path) => {
  checkRepo()
  await discardLocalChanges(repo, path)

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
  //     await fileOperations.removeFile(path)
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
    await merge(repo, theirSha)
    await refreshIndex(repo)
  } catch (e) {
    console.log('MERGE ERROR:', e)
  }
})

answerRenderer('repository:merge-branches', async (browserWindow, ourBranchName, theirBranchName) => {
  console.log(`MERGE ${ourBranchName} WITH ${theirBranchName}:`)
  checkRepo()
  try {
    const indexOrCommit = await mergeBranches(repo, ourBranchName, theirBranchName)
    await refreshIndex(repo)
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

  return fileDiffToParent(repo, sha, filePath)
})

answerRenderer('commit:file-diff-to-index', async (browserWindow, projectPath, filePath) => {
  checkRepo()

  return changedFileDiffToIndex(repo, projectPath, filePath)
})

answerRenderer('commit:stagedfile-diff-to-head', async (browserWindow, filePath) => {
  checkRepo()

  return stagedFileDiffToHead(repo, filePath)
})

answerRenderer('commit:conflictedfile-diff', async (browserWindow, filePath) => {
  checkRepo()

  const mineContent = await getMineFileContent(repo, filePath)

  const theirsContent = await getTheirsFileContent(repo, filePath)

  return {
    mineContent,
    theirsContent
  }
})

// получение информации о коммите для отображения в списке
answerRenderer('commit:digest-info', async (browserWindow, startIndex, endIndex) => {
  return gitLogResult.commits.slice(startIndex, endIndex)
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

  const remote = await getRemote(repo, remoteName)

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

  const remote = await getRemote(repo, remoteName)

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

  const remote = await getRemote(repo, remoteName)

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

  return createBranch(repo, name, commit)
})

answerRenderer('branch:delete', async (browserWindow, name) => {
  checkRepo()

  return deleteBranch(repo, name)
})

answerRenderer('tag:create', async (browserWindow, target, name, message) => {
  checkRepo()

  return createTag(repo, target, name, user.name, user.email, message)
})

answerRenderer('tag:delete', async (browserWindow, name) => {
  checkRepo()

  return deleteTagByName(repo, name)
})

answerRenderer('commit:reset-soft', async (browserWindow, sha) => {
  checkRepo()

  return softResetToCommit(repo, sha)
})

answerRenderer('commit:reset-mixed', async (browserWindow, sha) => {
  checkRepo()

  return mixedResetToCommit(repo, sha)
})

answerRenderer('commit:reset-hard', async (browserWindow, sha) => {
  checkRepo()

  return hardResetToCommit(repo, sha)
})

answerRenderer('commit:revert', async (browserWindow, sha) => {
  checkRepo()

  return revertCommit(repo, sha)
})

answerRenderer('merge:resolve-using-mine', async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    const fileContent = await getMineFileContent(repo, filePath)
    await fileOperations.saveFile(join(projectPath, filePath), fileContent)
    await removeConflict(repo, filePath)

    const index = await refreshIndex(repo)
    await addToIndex(index, filePath)
    await writeIndex(index)
  } catch (e) {
    console.log('RESOLVE USING MINE ERROR:', e)
  }
})

answerRenderer('merge:resolve-using-theirs', async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    const fileContent = await getTheirsFileContent(repo, filePath)
    await fileOperations.saveFile(join(projectPath, filePath), fileContent)
    await removeConflict(repo, filePath)

    const index = await refreshIndex(repo)
    await addToIndex(index, filePath)
    await writeIndex(index)
  } catch (e) {
    console.log('RESOLVE USING THEIRS ERROR:', e)
  }
})

answerRenderer('repository:add-remote', async (browserWindow, name, url) => {
  checkRepo()
  try {
    await addRemote(repo, name, url)
    return await getRemotes(repo)
  } catch (e) {}
})

answerRenderer('repository:delete-remote', async (browserWindow, name) => {
  checkRepo()
  try {
    await deleteRemote(repo, name)
    return await getRemotes(repo)
  } catch (e) {}
})

answerRenderer('repository:set-user-details', async (browserWindow, userName, email, useForAllRepositories) => {
  let config
  if (useForAllRepositories) {
    config = await findConfig()
  }
  if (!config && !useForAllRepositories) {
    config = await openRepoConfig(repo)
  }

  if (!config) return

  await setUserNameEmail(config, userName, email)
})

answerRenderer('repository:clone', async (browserWindow, remoteUrl, targetFolder, userName, password) => {
  await cloneRepository(remoteUrl, targetFolder, userName, password)
})

answerRenderer('repository:init', async (browserWindow, folder) => {
  await createRepository(folder)
})

/* FAKE APPLICATION (from editor) */

answerRenderer('remove-file', (browserWindow, path) => {
  console.log('MAIN: remove-file ', path)
  return fileOperations.removeFile(path)
})

answerRenderer('open-project', (browserWindow, projectPath) => {
  // return Promise.resolve()
  // return new Promise((resolve, reject) => {
  //   fileOperations
  //     .openProject(projectPath)
  //     .then(notifier => {
  //       notifier.on('ready', fileTree => {
  //         browserWindow.webContents.send('file-tree:ready', fileTree)
  //       })
  //       notifier.on('path-add', path => {
  //         browserWindow.webContents.send('file-tree:path-add', path)
  //       })
  //       notifier.on('path-remove', path => {
  //         browserWindow.webContents.send('file-tree:path-remove', path)
  //       })
  //       // notifier.on('path-rename', (src, dst) => {
  //       //   browserWindow.webContents.send('file-tree:path-rename', src, dst)
  //       // })
  //       notifier.on('path-rename', ([source, destination]) => {
  //         browserWindow.webContents.send('file-tree:path-rename', source, destination)
  //       })
  //       notifier.on('path-change', path => {
  //         browserWindow.webContents.send('file-tree:path-change', path)
  //       })
  //       resolve()
  //     })
  //     .catch(reject)
  // })
})

ipcMain.on('close-project', event => {
  // fileOperations.closeProject()
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
