const { ipcRenderer, remote } = window.require('electron')
const { callMain, answerMain } = require('./ipc').default(ipcRenderer)

import React, { Component } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import HistoryPage from './src/components/vcs/history-page'

import Workspace from './workspace'

const workspace = new Workspace()

const GlobalStyle = createGlobalStyle`
  .List {
    width: 100%;
  }
`

const RootStyle = styled.div`
  height: 100%;
`

export default class App extends Component {
  state = {
    commits: [],
    commiters: [],
    refs: [],
    sha: null,
    originalFile: '',
    modifiedFile: ''
  }

  async componentDidMount() {
    await callMain('repository:open', '../test-repo')

    const status = await callMain('repository:get-status')
    console.log(status)

    const references = await callMain('repository:get-references')
    console.log(references)

    const data = await callMain('gitlog')

    if (data) {
      const { commits, commiters, refs } = data
      this.setState({ commits, commiters, refs })
    }
  }

  onCommitSelect = async sha => {
    this.setState({ sha, originalFile: '', modifiedFile: '' })
    return await callMain('commit:get-info', sha)
  }

  onHistoryContextMenu = sha => {
    workspace.showContextMenu({
      items: [
        {
          label: 'Checkout...',
          click: (menuItem, browserWindow, event) => {
            console.log('CHECKOUT!!!')

            // если текущий sha в состоянии оторванной головы и переход на голову, то никаких подтверждений не нужно (если нет изменений в рабочем каталоге!!!)

            // если попытка сменить голову без отказа от измененных файлов, то вывести ошибку!!!

            // Your local changes to the following files would be overwritten by checkout:
            //   file.txt
            // Please commit your changes or stash them before you switch branches.
            // Aborting

            this.confirmBranchSwitch(sha)
              .then(({ discardLocalChanges } = {}) => {
                console.log('CHECKOUT AND DISCARD LOCAL CHANGES:', discardLocalChanges)
              })
              .catch(e => {
                console.log('CANCEL', e)
              })
          },
          enabled: !!sha
        },
        {
          label: 'Merge...',
          click: (menuItem, browserWindow, event) => {
            console.log('MERGE!!!')
          },
          enabled: !!sha
        },
        {
          label: 'Rebase...',
          click: (menuItem, browserWindow, event) => {
            console.log('REBASE!!!')
          },
          enabled: !!sha
        },
        {
          type: 'separator'
        },
        {
          label: 'Tag...',
          click: (menuItem, browserWindow, event) => {
            console.log('REBASE!!!')
          },
          enabled: !!sha
        },
        {
          type: 'separator'
        },
        {
          label: 'Branch...',
          click: (menuItem, browserWindow, event) => {
            console.log('BRANCH!!!')
          }
        }
      ]
    })
  }

  onPathSelect = async path => {
    try {
      const { originalContent = '', modifiedContent = '', details } = await callMain(
        'commit:file-diff',
        this.state.sha,
        path
      )

      if (details) {
        console.log(details)
      }

      this.setState({ originalFile: originalContent, modifiedFile: modifiedContent })
    } catch (e) {
      console.error(e)
    }
  }

  confirmBranchSwitch(sha) {
    const branch = this.state.refs.find(item => item.sha === sha)

    const workingDirIsDirty = true
    let message = ''
    let detail = ''

    if (branch) {
      message = `Confirm Branch Switch`
      detail = `Are you sure you want to switch your working copy to the branch '${branch.name}'?`
    } else {
      message = `Confirm change working copy`
      detail = `Are you sure you want to checkout '${sha}'? Doing so will make your working copy a 'detached HEAD', which means you won't be on a branch anymore. If you want to commit after this you'll probably want to either checkout a branch again, or create a new branch. Is this ok?`
    }

    return new Promise((resolve, reject) => {
      remote.dialog.showMessageBox(
        {
          type: 'question',
          message,
          detail,
          buttons: ['OK', 'Cancel'],
          defaultId: 0,
          cancelId: 1,
          checkboxLabel: workingDirIsDirty ? 'Discard local changes' : ''
          // icon: warningIcon
        },
        (index, checkboxChecked) => {
          if (index === 0) {
            resolve({ discardLocalChanges: !!checkboxChecked })
          } else {
            reject()
          }
        }
      )
    })
  }

  render() {
    return (
      <>
        <GlobalStyle />
        <RootStyle>
          <HistoryPage
            commits={this.state.commits}
            commiters={this.state.commiters}
            refs={this.state.refs}
            onCommitSelect={this.onCommitSelect}
            onHistoryContextMenu={this.onHistoryContextMenu}
            onPathSelect={this.onPathSelect}
            originalFile={this.state.originalFile}
            modifiedFile={this.state.modifiedFile}
          />
        </RootStyle>
      </>
    )
  }
}
