// const { ipcRenderer } = window.require('electron')
// const { callMain } = require('./ipc').default(ipcRenderer)

import { callMain } from './ipc'

import { observable, action, transaction, computed } from 'mobx'

class VCS {
  @observable mode = 'commit' // log | commit

  // commiter info
  @observable name = 'Igor Kling'
  @observable email = 'klingigor@gmail.com'

  // commit
  @observable commitMessage = ''

  @action.bound
  setCommitMessage(event) {
    this.commitMessage = event.target.value
  }

  @observable.ref previousCommits = []

  // git tree
  @observable.ref commits = []
  @observable.ref commiters = []
  @observable.ref refs = []

  // diff editor
  @observable originalFile = ''
  @observable modifiedFile = ''

  @observable.ref commitInfo = null

  @computed get selectedCommit() {
    if (!this.commitInfo) return null

    return this.commitInfo.commit
  }

  @observable commitSelectedFile = null

  @action
  async openRepo(path) {
    await callMain('repository:open', path)
  }

  @action.bound
  async getLog() {
    const data = await callMain('repository:log')

    console.log('DATA:', data)

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
    this.mode = 'log'
  }

  @action.bound
  commitMode() {
    this.mode = 'commit'
  }

  @action.bound
  logMode() {
    this.mode = 'log'
  }
}

export default VCS
