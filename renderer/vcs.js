// const { ipcRenderer } = window.require('electron')
// const { callMain } = require('./ipc').default(ipcRenderer)
import { CompositeDisposable, Disposable } from 'event-kit'
import { callMain } from './ipc'

import { observable, action, transaction, computed } from 'mobx'

/**
 * Convenient function
 * @param {EventEmitter} emitter
 * @param {String} eventName
 * @param {Function} handler
 * @returns {Disposable}
 */
const disposableEventHandler = (emitter, eventName, handler) => {
  emitter.on(eventName, handler)

  return new Disposable(() => {
    emitter.off(eventName, handler)
  })
}

const sort = array =>
  array.sort((a, b) => {
    const aStr = `${a.path}/${a.filename}`
    const bStr = `${b.path}/${b.filename}`

    if (aStr > bStr) {
      return 1
    }
    if (aStr < bStr) {
      return -1
    }
    return 0
  })

export class VCS {
  @observable mode = 'commit' // log | commit

  onModeChange = () => {}

  setModeChangeHandler(handler) {
    this.onModeChange = handler
  }

  // commiter info
  @observable name = ''
  @observable email = ''

  // commit
  @observable commitMessage = ''

  @observable.ref changedFiles = []
  @observable.ref stagedFiles = []

  @observable.ref previousCommits = []

  // git tree
  @observable.ref commits = []
  @observable.ref commiters = []
  @observable.ref refs = []
  @observable.ref remotes = []

  // diff editor
  @observable originalFile = ''
  @observable modifiedFile = ''

  @observable.ref commitInfo = null

  @computed get selectedCommit() {
    if (!this.commitInfo) return null

    return this.commitInfo.commit
  }

  @observable commitSelectedFile = null

  constructor({ project, applicationDelegate }) {
    this.project = project
    this.applicationDelegate = applicationDelegate
  }

  @action.bound
  onChangedFilesChanged(files) {}

  @action.bound
  onStagedFilesChanged(files) {}

  @action.bound
  setCommitMessage(event) {
    this.commitMessage = event.target.value
  }

  // ui-optimistic addition to index specified files
  @action
  addToStage(collection) {
    let selected = collection.slice()

    const [filtered, remained] = this.changedFiles.reduce(
      (acc, item) => {
        const fullPath = `${item.path}/${item.filename}`
        const index = selected.findIndex(i => i === fullPath)
        if (index !== -1) {
          acc[0].push(item)
          selected = [...selected.slice(0, index), ...selected.slice(index + 1)]
        } else {
          acc[1].push(item)
        }

        return acc
      },
      [[], []]
    )

    transaction(() => {
      this.stagedFiles = sort([...new Set([...this.stagedFiles, ...filtered])])
      this.changedFiles = sort(remained)
    })

    // вызываем операцию добавления в индекс
    // по факту операции меняем состояние
  }

  // ui-optimistic removing from index specified files
  @action
  removeFromStage(collection) {
    let selected = collection.slice()

    const [filtered, remained] = this.stagedFiles.reduce(
      (acc, item) => {
        const fullPath = `${item.path}/${item.filename}`
        const index = selected.findIndex(i => i === fullPath)
        if (index !== -1) {
          acc[0].push(item)
          selected = [...selected.slice(0, index), ...selected.slice(index + 1)]
        } else {
          acc[1].push(item)
        }

        return acc
      },
      [[], []]
    )

    transaction(() => {
      this.changedFiles = sort([...new Set([...this.changedFiles, ...filtered])])
      this.stagedFiles = sort(remained)
    })

    // вызываем операцию удаления из индекса
    // по факту операции меняем состояние
  }

  @action
  async openRepo(path) {
    const { user, remotes } = await callMain('repository:open', path)

    if (user) {
      const { name, email } = user
      transaction(() => {
        this.name = name
        this.email = email
      })
    }

    if (remotes) {
      this.remotes = remotes
    }

    this.disposables = new CompositeDisposable()

    // on project open
    this.disposables.add(
      disposableEventHandler(this.project, 'project-opened', () => {
        this.projectDisposables = new CompositeDisposable()

        this.projectDisposables.add(
          this.applicationDelegate.onProjectFilePathAdd((sender, path) => {
            console.log(`[VCS] added ${path.replace(this.project.projectPath, '')}`)
          }),

          this.applicationDelegate.onProjectFilePathRemove((sender, path) => {
            const relativePath = path.replace(this.project.projectPath, '')
            console.log(`[VCS] removed ${relativePath}`)
            // this.fileTreeView.remove(relativePath)
          }),

          this.applicationDelegate.onProjectFilePathRename((sender, src, dst) => {
            console.log(
              `[VCS] renaming ${src.replace(this.project.projectPath, '')} to ${dst.replace(
                this.project.projectPath,
                ''
              )}`
            )
            // this.fileTreeView.rename(
            //   src.replace(vision.project.projectPath, ''),
            //   dst.replace(vision.project.projectPath, '')
            // )
          }),

          this.applicationDelegate.onProjectFilePathChange((sender, path) => {
            console.log(`[VCS] changed outside of IDE ${path.replace(this.project.projectPath, '')}`)
          })
        )
      }),

      disposableEventHandler(this.project, 'project-closed', () => {
        if (this.projectDisposables) {
          this.projectDisposables.dispose()
          this.projectDisposables = null
        }
      })
    )
  }

  @action.bound
  async getLog() {
    const data = await callMain('repository:log')

    if (data) {
      const { commits, commiters, refs } = data

      transaction(() => {
        this.commits = commits
        this.commiters = commiters
        this.refs = refs
      })
    }
  }

  @action.bound
  async onCommitSelect(sha) {
    if (this.commitInfo && this.commitInfo.commit === sha) return

    const commitInfo = await callMain('commit:get-info', sha)
    // получаем информацию о выделенном коммите
    // const {
    //   commit,
    //   author: {
    //     name,
    //     email,
    //   },
    //   date,
    //   message,
    //   parents,
    //   paths,
    //   labels
    // }

    transaction(() => {
      this.originalFile = ''
      this.modifiedFile = ''
      this.commitSelectedFile = null
      this.commitInfo = commitInfo
    })
  }

  @action.bound
  async onCommitFileSelect(path) {
    if (!this.commitInfo) return
    if (this.commitSelectedFile === path) return

    this.commitSelectedFile = path

    try {
      // запрашиваем детальную информацию по файлу
      const { originalContent = '', modifiedContent = '', details: errorDetails } = await callMain(
        'commit:file-diff',
        this.commitInfo.commit,
        path.replace(/^\/+/, '') // remove leading slash
      )

      transaction(() => {
        this.originalFile = originalContent
        this.modifiedFile = modifiedContent
      })
    } catch (e) {
      console.log('FILE DETAILS ERROR:', e)
    }
  }

  @action.bound
  async onCheckout(sha) {
    // TODO: это и так предмет модели - должно постоянно обновляться по сигналам от watcher
    const status = await callMain('repository:get-status')
    const workdirIsClean = status.length === 0

    const branch = this.refs.find(item => item.sha === sha)

    // TODO: !!!!!!!!!!!!!!!!
    try {
      if (!workdirIsClean || !branch) {
        const { discardLocalChanges } = await this.confirmBranchSwitch(sha, workdirIsClean, branch && branch.name)

        // Your local changes to the following files would be overwritten by checkout:
        //   file.txt
        // Please commit your changes or stash them before you switch branches.
        // Aborting

        if (!workdirIsClean && !discardLocalChanges) {
          console.log('Your local changes to would be overwritten by checkout!!!')
          throw new Error('Abort checkout in dirty working dir...')
        }
      }

      await callMain('repository:checkout', sha)

      await this.getLog()
    } catch (e) {
      console.log('canceled:', e)
    }
  }

  @action.bound
  onCommit() {
    console.log('commit')

    //  берем сообщение коммита и добавляем в начало списка (если уникальное)
    //  очищаем сообщение коммита!!
  }

  @action.bound
  onCancelCommit() {
    this.logMode()
  }

  @action.bound
  commitMode() {
    if (this.mode === 'commit') return
    this.mode = 'commit'
    this.onModeChange(this.mode)
  }

  @action.bound
  logMode() {
    if (this.mode === 'log') return
    this.mode = 'log'
    this.onModeChange(this.mode)
  }
}
