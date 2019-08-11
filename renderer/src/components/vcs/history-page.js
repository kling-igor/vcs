import React, { Component, memo } from 'react'
import SplitPane, { Pane } from '../react-split'
import styled from 'styled-components'

import { History } from './history'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

const onMainSplitResize = layout => {
  console.log(layout)
}

const onSecondarySplitResize = layout => {
  console.log(layout)
}

const DiffPane = memo(() => {
  return <RootStyle style={{ background: 'red' }}> </RootStyle>
})

const CommitInfoPane = memo(() => {
  return (
    <RootStyle
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}
    >
      <span>{`commit: #deadbeef`}</span>
      <span>{`author: Igor Kling <klingigor@gmail.com>`}</span>
      <span>{`parents: #aabbcdd`}</span>
      <span>{`date: 8 aug 2019`}</span>
    </RootStyle>
  )
})

const FileTree = memo(() => {
  return <RootStyle style={{ backgroundColor: 'yellow' }} />
})

export default class HistoryPage extends Component {
  render() {
    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
        <Pane size={200} minSize="50px" maxSize="100%">
          <History commits={this.props.commits} commiters={this.props.commiters} />
        </Pane>
        <Pane size={200} minSize="50px" maxSize="100%">
          <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={onSecondarySplitResize}>
            <Pane size={200} minSize="200px" maxSize="100%">
              <RootStyle style={{ background: 'magenta' }}>
                <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
                  <Pane size={200} minSize="50px" maxSize="100%">
                    <FileTree />
                  </Pane>
                  <Pane size={200} minSize="50px" maxSize="100%">
                    <CommitInfoPane />
                  </Pane>
                </SplitPane>
              </RootStyle>
            </Pane>
            <Pane size={200} minSize="400px" maxSize="100%">
              <DiffPane />
            </Pane>
          </SplitPane>
        </Pane>
      </SplitPane>
    )
  }
}
