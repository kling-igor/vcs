// const { ipcRenderer } = window.require('electron')
// const { callMain } = require('./ipc').default(ipcRenderer)
import { CompositeDisposable, Disposable } from 'event-kit'
import { join } from 'path'
import * as _ from 'lodash'
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

  constructor({ workspace, project, applicationDelegate }) {
    this.workspace = workspace
    this.project = project
    this.applicationDelegate = applicationDelegate

    this.debouncedStatus = _.debounce(this.status, 1000)
  }

  @action.bound
  onChangedFilesChanged(files) {
    this.changedFiles = files
  }

  @action.bound
  onStagedFilesChanged(files) {
    this.stagedFiles = files
  }

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

  @action.bound
  async status() {
    const statuses = await callMain('repository:get-status')

    console.log('STATUSES:', statuses)

    const [stagedFiles, changedFiles] = statuses.reduce(
      (acc, item) => {
        const { status } = item

        let selected = false

        let workdirStatus = ''

        if (status.includes('I')) {
          const foundInStaged = this.stagedFiles.find(
            ({ path, filename }) => path === item.path && filename === item.filename
          )

          let stagedStatus = status.replace('I', '')
          if (stagedStatus.includes('A')) {
            workdirStatus = stagedStatus.replace('A', '')
            stagedStatus = 'A'
          } else if (stagedStatus.includes('D')) {
            workdirStatus = stagedStatus.replace('D', '')
            stagedStatus = 'D'
          } else if (stagedStatus.includes('M')) {
            workdirStatus = stagedStatus.replace('M', '')
            stagedStatus = 'M'
          } else if (stagedStatus.includes('R')) {
            workdirStatus = stagedStatus.replace('R', '')
            stagedStatus = 'R'
          }

          selected = (foundInStaged && foundInStaged.selected) || false

          acc[0].push({ ...item, selected, status: stagedStatus })

          if (!workdirStatus) {
            return acc
          }
        }

        const foundInChanged = this.changedFiles.find(
          ({ path, filename }) => path === item.path && filename === item.filename
        )

        selected = (foundInChanged && foundInChanged.selected) || false

        acc[1].push({ ...item, selected, status: workdirStatus || item.status })
        return acc
      },
      [[], []]
    )

    transaction(() => {
      // TODO:  предварительно в changedFiles и stagedFiles добавляем статусы соответствующих элементов

      this.changedFiles = changedFiles
      this.stagedFiles = stagedFiles
    })
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
            this.debouncedStatus()
          }),

          this.applicationDelegate.onProjectFilePathRemove((sender, path) => {
            const relativePath = path.replace(this.project.projectPath, '')
            console.log(`[VCS] removed ${relativePath}`)
            // this.fileTreeView.remove(relativePath)
            this.debouncedStatus()
          }),

          this.applicationDelegate.onProjectFilePathRename((sender, src, dst) => {
            console.log(
              `[VCS] renaming ${src.replace(this.project.projectPath, '')} to ${dst.replace(
                this.project.projectPath,
                ''
              )}`
            )
            this.debouncedStatus()
            // this.fileTreeView.rename(
            //   src.replace(vision.project.projectPath, ''),
            //   dst.replace(vision.project.projectPath, '')
            // )
          }),

          this.applicationDelegate.onProjectFilePathChange((sender, path) => {
            console.log(`[VCS] changed outside of IDE ${path.replace(this.project.projectPath, '')}`)
            this.debouncedStatus()
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

    this.debouncedStatus()
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
  async onCommit() {
    if (this.stagedFiles.length === 0) return

    await callMain('commit:create', this.commitMessage)

    await this.getLog()
    await this.status()

    transaction(() => {
      const stippedMessage = this.commitMessage.slice(0, 80)
      if (this.previousCommits[0] !== stippedMessage) {
        this.previousCommits = [stippedMessage, ...this.previousCommits]
      }

      this.stagedFiles = []
      this.commitMessage = ''
    })

    this.logMode()
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

  @action.bound
  showStagedFilesMenu() {
    const hasStagedFiles = this.stagedFiles.length > 0
    const selectedStagedFilesCount = this.stagedFiles.reduce((acc, { selected }) => (acc + selected ? 1 : 0), 0)

    this.workspace.showContextMenu({
      items: [
        {
          label: 'Select All',
          click: action(() => {
            this.stagedFiles = this.selectAllFiles(this.stagedFiles)
          }),
          enabled: hasStagedFiles
        },
        {
          label: 'Unselect All',
          click: action(() => {
            this.stagedFiles = this.unselectAllFiles(this.stagedFiles)
          }),
          enabled: hasStagedFiles
        },
        {
          label: 'Inverse Selection',
          click: action(() => {
            this.stagedFiles = this.inverseSelection(this.stagedFiles)
          }),
          enabled: hasStagedFiles
        },
        {
          type: 'separator'
        },
        {
          label: 'Unstage Selected',
          click: this.unstageSelectedFiles,
          enabled: hasStagedFiles && selectedStagedFilesCount > 0
        },
        {
          label: 'Unstage All',
          click: this.unstageAllFiles,
          enabled: hasStagedFiles
        }
      ]
    })
  }

  @action.bound
  showChangedFilesMenu() {
    const hasChangedFiles = this.changedFiles.length > 0
    const selectedChangesFilesCount = this.changedFiles.reduce((acc, { selected }) => (acc + selected ? 1 : 0), 0)

    this.workspace.showContextMenu({
      items: [
        {
          label: 'Select All',
          click: action(() => {
            this.changedFiles = this.selectAllFiles(this.changedFiles)
          }),
          enabled: hasChangedFiles
        },
        {
          label: 'Unselect All',
          click: action(() => {
            this.changedFiles = this.unselectAllFiles(this.changedFiles)
          }),
          enabled: hasChangedFiles
        },
        {
          label: 'Inverse Selection',
          click: action(() => {
            this.changedFiles = this.inverseSelection(this.changedFiles)
          }),
          enabled: hasChangedFiles
        },
        {
          type: 'separator'
        },
        {
          label: 'Stage Selected',
          click: this.stageSelectedFiles,
          enabled: hasChangedFiles && selectedChangesFilesCount > 0
        },
        {
          label: 'Stage All',
          click: this.stageAllFiles,
          enabled: hasChangedFiles
        }
      ]
    })
  }

  selectAllFiles(collection) {
    return collection.map(item => ({ ...item, selected: true }))
  }

  unselectAllFiles(collection) {
    return collection.map(item => ({ ...item, selected: false }))
  }

  inverseSelection(collection) {
    return collection.map(item => ({ ...item, selected: !item.selected }))
  }

  @action.bound
  async stageSelectedFiles() {
    const paths = this.changedFiles.reduce((acc, item) => {
      if (item.selected) {
        return [...acc, join(item.path, item.filename)]
      }

      return acc
    }, [])
    if (paths.length > 0) {
      await callMain('stage:add', paths)
      await this.status()
    }
  }

  @action.bound
  async stageAllFiles() {
    const paths = this.changedFiles.reduce((acc, item) => [...acc, join(item.path, item.filename)], [])
    if (paths.length > 0) {
      await callMain('stage:add', paths)
      await this.status()
    }
  }

  @action.bound
  async unstageSelectedFiles() {
    const paths = this.stagedFiles.reduce((acc, item) => {
      if (item.selected) {
        return [...acc, join(item.path, item.filename)]
      }

      return acc
    }, [])
    if (paths.length > 0) {
      await callMain('stage:remove', paths)
      await this.status()
    }
  }

  @action.bound
  async unstageAllFiles() {
    const paths = this.stagedFiles.reduce((acc, item) => [...acc, join(item.path, item.filename)], [])
    if (paths.length > 0) {
      await callMain('stage:remove', paths)

      await this.status()
    }
  }
}
