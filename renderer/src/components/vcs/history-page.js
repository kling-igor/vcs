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

const CommitInfoPane = memo(({ commitInfo }) => {
  if (!commitInfo) return null

  const {
    commit,
    author: { name, email },
    date,
    message,
    parents,
    labels
  } = commitInfo

  const parentsString = parents.join(', ')
  const labelsString = labels.join(', ')

  return (
    <RootStyle
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}
    >
      <span>{message}</span>
      <span>{`Commit: ${commit}`}</span>
      <span>{`Parents: ${parentsString}`}</span>
      <span>{`Author: ${name} <${email}>`}</span>
      <span>{`${date}`}</span>
      <span>{`Labels: ${labelsString}`}</span>
    </RootStyle>
  )
})

const FileTree = memo(() => {
  return <RootStyle style={{ backgroundColor: 'yellow' }} />
})

export default class HistoryPage extends Component {
  state = {
    commitInfo: null
  }

  onRowClick = async sha => {
    const commitInfo = await this.props.onCommitSelect(sha)
    this.setState({ commitInfo })
  }

  render() {
    const { commits, commiters } = this.props

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
        <Pane size={200} minSize="50px" maxSize="100%">
          <History commits={commits} commiters={commiters} onRowClick={this.onRowClick} />
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
                    <CommitInfoPane commitInfo={this.state.commitInfo} />
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
