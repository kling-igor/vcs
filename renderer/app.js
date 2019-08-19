const { ipcRenderer } = window.require('electron')
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
