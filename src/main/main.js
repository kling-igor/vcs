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

import * as MESSAGES from '../common/messages'

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
      pathname: resolve(__dirname, '..', 'index.html'),
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

answerRenderer(MESSAGES.VCS_OPEN_REPOSITORY, async (browserWindow, path) => {
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

answerRenderer(MESSAGES.VCS_CLOSE_REPOSITORY, async (browserWindow, path) => {
  repo = null
})

const checkRepo = () => {
  if (!repo) {
    throw new Error('REPO IS NOT OPENED')
  }
}

// TODO add codes for state rebase and merge
answerRenderer(MESSAGES.VCS_GET_REPOSITORY_STATUS, async browserWindow => {
  checkRepo()

  return await gitops.status(repo)
})

answerRenderer(MESSAGES.VCS_GET_HEAD_BRANCH, async browserWindow => {
  checkRepo()

  return await gitops.headCommit(repo)
})

answerRenderer(MESSAGES.VCS_GET_REPOSITORY_REFS, async browserWindow => {
  checkRepo()

  return await gitops.getReferences(repo)
})

answerRenderer(MESSAGES.VCS_GET_COMMIT_DETAILS, async (browserWindow, sha) => {
  checkRepo()

  if (!sha) {
    console.error('sha not specified')
    return null
  }

  return gitops.commitInfo(repo, sha)
})

answerRenderer(MESSAGES.VCS_CREATE_COMMIT, async (browserWindow, message, mergingCommitSha, name, email) => {
  checkRepo()

  try {
    const index = await repo.index()
    await gitops.writeIndex(index)
    await gitops.commit(repo, message, name, email, mergingCommitSha)
  } catch (e) {
    console.log('COMMIT ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_ADD_TO_STAGE, async (browserWindow, paths) => {
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

answerRenderer(MESSAGES.VCS_REMOVE_FROM_STAGE, async (browserWindow, paths) => {
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

answerRenderer(MESSAGES.VCS_CHECKOUT_BRANCH, async (browserWindow, branch, discardLocalChanges) => {
  checkRepo()
  console.log('CHECKOUT TO BRANCH:', branch, discardLocalChanges)
  return gitops.checkoutBranch(repo, branch, discardLocalChanges)
})

answerRenderer(MESSAGES.VCS_CHECKOUT_COMMIT, async (browserWindow, sha, discardLocalChanges) => {
  checkRepo()
  return gitops.checkoutToCommit(repo, sha, discardLocalChanges)
})

answerRenderer(MESSAGES.VCS_DISCARD_LOCAL_CHANGES, async (browserWindow, projectRoot, path) => {
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

answerRenderer(MESSAGES.VCS_MERGE, async (browserWindow, theirSha) => {
  console.log('MERGE WITH:', theirSha)
  checkRepo()
  try {
    await gitops.merge(repo, theirSha)
    await gitops.refreshIndex(repo)
  } catch (e) {
    console.log('MERGE ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_MERGE_BRANCHES, async (browserWindow, ourBranchName, theirBranchName) => {
  console.log(`MERGE ${ourBranchName} WITH ${theirBranchName}:`)
  checkRepo()
  try {
    const indexOrCommit = await gitops.mergeBranches(repo, ourBranchName, theirBranchName)
    await gitops.refreshIndex(repo)
  } catch (e) {
    console.log('MERGE ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_GET_INDEX_FILE_BUFFER, async (browserWindow, filePath) => {
  checkRepo()

  return await gitops.getIndexedFileContent(repo, filePath)
})

answerRenderer(MESSAGES.VCS_GET_COMMIT_FILE_BUFFER, async (browserWindow, sha, filePath) => {
  checkRepo()
  return gitops.getCommitFileContent(repo, sha, filePath)
})

answerRenderer(MESSAGES.VCS_CREATE_INDEX_TMP_FILE, async (browserWindow, filePath) => {
  checkRepo()

  const buffer = await gitops.getIndexedFileContent(repo, filePath)

  const tempPath = join('/tmp', `index_${filePath}`)
  await fileops.saveFile(tempPath, buffer)

  return tempPath
})

answerRenderer(MESSAGES.VCS_CREATE_COMMIT_TMP_FILE, async (browserWindow, sha, filePath) => {
  checkRepo()

  const buffer = await gitops.getCommitFileContent(repo, sha, filePath)

  const tempPath = join('/tmp', `${sha}_${filePath}`)
  await fileops.saveFile(tempPath, buffer)

  return tempPath
})

answerRenderer(MESSAGES.VCS_GET_OUR_FILE_BUFFER, async (browserWindow, filePath) => {
  checkRepo()
  return await gitops.getMineFileContent(repo, filePath)
})

answerRenderer(MESSAGES.VCS_GET_THEIR_FILE_BUFFER, async (browserWindow, filePath) => {
  checkRepo()
  return await gitops.getTheirsFileContent(repo, filePath)
})

answerRenderer(MESSAGES.VCS_GET_OUR_TMP_FILE, async (browserWindow, filePath) => {
  const buffer = await gitops.getMineFileContent(repo, filePath)

  if (buffer) {
    const tempPath = join('/tmp', `our_${filePath}`)
    await fileops.saveFile(tempPath, buffer)

    return tempPath
  }
})

answerRenderer(MESSAGES.VCS_GET_THEIR_TMP_FILE, async (browserWindow, filePath) => {
  const buffer = await gitops.getTheirsFileContent(repo, filePath)

  if (buffer) {
    const tempPath = join('/tmp', `their_${filePath}`)
    await fileops.saveFile(tempPath, buffer)

    return tempPath
  }
})

// получение информации о коммите для отображения в списке
answerRenderer(MESSAGES.VCS_GET_COMMIT_DIGEST, async (browserWindow, startIndex, endIndex) => {
  return gitLogResult.commits.slice(startIndex, endIndex + 1)
})

answerRenderer(MESSAGES.VCS_GET_LOG, async (browserWindow, projectPath) => {
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

answerRenderer(MESSAGES.VCS_FETCH, async (browserWindow, projectPath, remoteName, userName, password) => {
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

answerRenderer(MESSAGES.VCS_PUSH, async (browserWindow, projectPath, remoteName, branch, userName, password) => {
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

answerRenderer(MESSAGES.VCS_CREATE_BRANCH, async (browserWindow, name, commit) => {
  checkRepo()

  return gitops.createBranch(repo, name, commit)
})

answerRenderer(MESSAGES.VCS_DELETE_BRANCH, async (browserWindow, name) => {
  checkRepo()

  return gitops.deleteBranch(repo, name)
})

answerRenderer(MESSAGES.VCS_CREATE_TAG, async (browserWindow, target, name, message) => {
  checkRepo()

  return gitops.createTag(repo, target, name, user.name, user.email, message)
})

answerRenderer(MESSAGES.VCS_DELETE_TAG, async (browserWindow, name) => {
  checkRepo()

  return gitops.deleteTagByName(repo, name)
})

answerRenderer(MESSAGES.VCS_RESET_COMMIT_SOFT, async (browserWindow, sha) => {
  checkRepo()

  return gitops.softResetToCommit(repo, sha)
})

answerRenderer(MESSAGES.VCS_RESET_COMMIT_MIXED, async (browserWindow, sha) => {
  checkRepo()

  return gitops.mixedResetToCommit(repo, sha)
})

answerRenderer(MESSAGES.VCS_RESET_COMMIT_HARD, async (browserWindow, sha) => {
  checkRepo()

  return gitops.hardResetToCommit(repo, sha)
})

answerRenderer(MESSAGES.VCS_REVERT_COMMIT, async (browserWindow, sha) => {
  checkRepo()

  return gitops.revertCommit(repo, sha)
})

answerRenderer(MESSAGES.VCS_RESOLE_AS_IS, async (browserWindow, projectPath, filePath, fileContent) => {
  checkRepo()
  try {
    await fileops.project.saveFile(filePath, fileContent)
    await gitops.removeConflict(repo, filePath)

    const index = await gitops.refreshIndex(repo)
    await gitops.addToIndex(index, filePath)
    await gitops.writeIndex(index)
  } catch (e) {
    console.log('RESOLVE AS IS ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_RESOLE_USING_OUR, async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    // TODO: как решить конфликт если файл был удален ,,,
    const fileContent = await gitops.getMineFileContent(repo, filePath)
    if (fileContent) {
      await fileops.project.saveFile(filePath, fileContent)
      await gitops.removeConflict(repo, filePath)

      const index = await gitops.refreshIndex(repo)
      await gitops.addToIndex(index, filePath)
      await gitops.writeIndex(index)
    } else {
      await fileops.project.removeFile(filePath)
      await gitops.removeConflict(repo, filePath)

      const index = await gitops.refreshIndex(repo)
      await gitops.removeFromIndex(index, filePath)
      await gitops.writeIndex(index)
    }
  } catch (e) {
    console.log('RESOLVE USING MINE ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_RESOLE_USING_THEIR, async (browserWindow, projectPath, filePath) => {
  checkRepo()
  try {
    const fileContent = await gitops.getTheirsFileContent(repo, filePath)
    if (fileContent) {
      await fileops.project.saveFile(filePath, fileContent)
      await gitops.removeConflict(repo, filePath)

      const index = await gitops.refreshIndex(repo)
      await gitops.addToIndex(index, filePath)
      await gitops.writeIndex(index)
    } else {
      await fileops.project.removeFile(filePath)
      await gitops.removeConflict(repo, filePath)

      const index = await gitops.refreshIndex(repo)
      await gitops.removeFromIndex(index, filePath)
      await gitops.writeIndex(index)
    }
  } catch (e) {
    console.log('RESOLVE USING THEIRS ERROR:', e)
  }
})

answerRenderer(MESSAGES.VCS_ADD_REMOTE, async (browserWindow, name, url) => {
  checkRepo()
  try {
    await gitops.addRemote(repo, name, url)
    return await gitops.getRemotes(repo)
  } catch (e) {}
})

answerRenderer(MESSAGES.VCS_DELETE_REMOTE, async (browserWindow, name) => {
  checkRepo()
  try {
    await gitops.deleteRemote(repo, name)
    return await gitops.getRemotes(repo)
  } catch (e) {}
})

answerRenderer(MESSAGES.VCS_SET_USER_DEFAULTS, async (browserWindow, userName, email, useForAllRepositories) => {
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

answerRenderer(MESSAGES.VCS_CLONE_REPOSITORY, async (browserWindow, remoteUrl, targetFolder, userName, password) => {
  await gitops.cloneRepository(remoteUrl, targetFolder, userName, password)
})

answerRenderer(MESSAGES.VCS_INIT_REPOSITORY, async (browserWindow, folder) => {
  await gitops.createRepository(folder)
})

answerRenderer(MESSAGES.VCS_GET_STASHES, async browserWindow => {
  return await gitops.getStashes(repo)
})

answerRenderer(MESSAGES.VCS_SAVE_STASH, async (browserWindow, message, keepStaged) => {
  await gitops.saveStash(repo, message, keepStaged)
})

answerRenderer(MESSAGES.VCS_APPLY_STASH, async (browserWindow, index) => {
  console.log('APPLY STASH:', index)
  return await gitops.applyStash(repo, index)
})

answerRenderer(MESSAGES.VCS_DROP_STASH, async (browserWindow, index) => {
  return await gitops.dropStash(repo, index)
})

/* FAKE APPLICATION (from editor) */

answerRenderer(MESSAGES.PROJECT_OPEN, async (browserWindow, projectPath, ...whiteList) => {
  return new Promise((resolve, reject) => {
    fileops.project
      .open(projectPath, whiteList)
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

ipcMain.on(MESSAGES.PROJECT_CLOSE, async event => {
  fileops.project.close()
})

answerRenderer(MESSAGES.PROJECT_GET_FILE_TYPE, async (browserWindow, filePath) => {
  return fileops.project.getFileType(filePath)
})

answerRenderer(MESSAGES.VCS_GET_FILE_TYPE, async (browserWindow, sha, filePath) => {
  const buffer = await gitops.getCommitFileContent(repo, sha, filePath)
  return fileops.getFileType(filePath, buffer)
})

answerRenderer(MESSAGES.PROJECT_CREATE_FOLDER, async (browserWindow, folderPath) => {
  return fileops.project.createFolder(folderPath)
})

answerRenderer(MESSAGES.PROJECT_GET_FILE_BUFFER, async (browserWindow, filePath) => {
  return fileops.project.readFileBuffer(filePath)
})

answerRenderer(MESSAGES.PROJECT_OPEN_FILE, async (browserWindow, filePath) => {
  return fileops.project.openFile(filePath)
})

answerRenderer(MESSAGES.PROJECT_SAVE_FILE, async (browserWindow, filePath, buffer) => {
  return fileops.project.saveFile(filePath, buffer)
})

answerRenderer(MESSAGES.PROJECT_RENAME_FILE, async (browserWindow, src, dst) => {
  return fileops.project.rename(src, dst)
})

answerRenderer(MESSAGES.PROJECT_REMOVE_FILE, async (browserWindow, path) => {
  return fileops.project.removeFile(path)
})

answerRenderer(MESSAGES.PROJECT_REMOVE_FOLDER, async (browserWindow, path) => {
  return fileops.project.removeFolder(path)
})

answerRenderer(MESSAGES.CORE_OPEN_FILE, async (browserWindow, filePath) => {
  return fileops.openFile(filePath)
})

answerRenderer(MESSAGES.CORE_SAVE_FILE, async (browserWindow, filePath, buffer) => {
  return fileops.saveFile(filePath, buffer)
})

answerRenderer(MESSAGES.CORE_REMOVE_FILE, async (browserWindow, path) => {
  return fileops.removeFile(path)
})

answerRenderer(MESSAGES.CORE_REMOVE_TMP_FILES, async (browserWindow, ...paths) => {
  for await (const path of paths) {
    if (path) {
      try {
        fileops.removeFile(path)
      } catch (e) {
        console.log('Unable to remove tmp file:', path)
      }
    }
  }
})
