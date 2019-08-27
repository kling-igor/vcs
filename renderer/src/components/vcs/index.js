import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import styled from 'styled-components'

import HistoryPage from './history-page'
import CommitPage from './commit-page'

const RootStyle = styled.div`
  height: 100%;
  width: 100%;
`

@observer
class VCSView extends Component {
  render() {
    const { storage } = this.props

    console.log('storage.mode:', storage.mode)

    if (storage.mode === 'log') {
      return (
        <RootStyle>
          <HistoryPage storage={storage} />
        </RootStyle>
      )
    } else if (storage.mode === 'commit') {
      return (
        <RootStyle>
          <CommitPage storage={storage} />
        </RootStyle>
      )
    }

    return null
  }
}

export default VCSView