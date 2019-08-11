const { ipcRenderer } = window.require('electron')
const { callMain, answerMain } = require('./ipc').default(ipcRenderer)

import React, { PureComponent } from 'react'
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

export default class App extends PureComponent {
  state = {
    commits: [],
    commiters: []
  }

  async componentDidMount() {
    const data = await callMain('gitlog')

    if (data) {
      const { commits, commiters } = data
      this.setState({ commits, commiters })
    }
  }

  onCommitSelect = async sha => {
    return await callMain('commit:info', sha)
  }

  render() {
    return (
      <>
        <GlobalStyle />
        <RootStyle>
          <HistoryPage
            commits={this.state.commits}
            commiters={this.state.commiters}
            onCommitSelect={this.onCommitSelect}
          />
        </RootStyle>
      </>
    )
  }
}
