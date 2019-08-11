const { ipcRenderer } = window.require('electron')
const { callMain, answerMain } = require('./ipc').default(ipcRenderer)

import React, { PureComponent } from 'react'
import { History } from './src/components/vcs/history'
import styled, { createGlobalStyle } from 'styled-components'

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

  render() {
    return (
      <>
        <GlobalStyle />
        <RootStyle>
          <History commits={this.state.commits} commiters={this.state.commiters} />
        </RootStyle>
      </>
    )
  }
}
