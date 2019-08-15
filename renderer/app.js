const { ipcRenderer } = window.require('electron')
const { callMain, answerMain } = require('./ipc').default(ipcRenderer)

import React, { Component } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import HistoryPage from './src/components/vcs/history-page'

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
    branches: [],
    sha: null,
    originalFile: '',
    modifiedFile: ''
  }

  async componentDidMount() {
    const data = await callMain('gitlog')

    if (data) {
      const { commits, commiters, branches } = data
      this.setState({ commits, commiters, branches })
    }
  }

  onCommitSelect = async sha => {
    this.setState({ sha, originalFile: '', modifiedFile: '' })
    return await callMain('commit:info', sha)
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
            branches={this.state.branches}
            onCommitSelect={this.onCommitSelect}
            onPathSelect={this.onPathSelect}
            originalFile={this.state.originalFile}
            modifiedFile={this.state.modifiedFile}
          />
        </RootStyle>
      </>
    )
  }
}
