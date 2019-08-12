import React, { Component, memo } from 'react'
import SplitPane, { Pane } from '../react-split'
import styled from 'styled-components'
import moment from 'moment'

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

const IconStyle = styled.span`
  display: inline-block;
  height: 40px;
  width: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 40px;
  color: white;
  background-color: ${({ color }) => color};
  font-size: 1.25em;
  margin: 8px;
  margin-right: 24px;
`

const TableStyle = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-left: 8px;
`

const LeftColumnStyle = styled.td`
  text-align: right;
  width: 50px;
`

const RightColumnStyle = styled.td`
  text-align: left;
`

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
  const labelsString = labels.join(', ').toUpperCase()

  const LETTERS = name
    .split(' ')
    .map(item => item.slice(0, 1))
    .slice(0, 2)

  return (
    <RootStyle
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}
      className="bp3-ui-text bp3-text-small"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <IconStyle color={'blue'}>{LETTERS}</IconStyle>
        </div>
        <div>
          <span>{message}</span>
        </div>
      </div>

      <TableStyle>
        <tbody>
          <tr>
            <LeftColumnStyle>Commit:</LeftColumnStyle>
            <RightColumnStyle className="bp3-monospace-text">
              {commit} {`[${commit.slice(0, 8)}]`}
            </RightColumnStyle>
          </tr>
          <tr>
            <LeftColumnStyle>Parents:</LeftColumnStyle>
            <RightColumnStyle className="bp3-monospace-text">{parentsString}</RightColumnStyle>
          </tr>
          <tr>
            <LeftColumnStyle>Author:</LeftColumnStyle>
            <RightColumnStyle>{`${name} <${email}>`}</RightColumnStyle>
          </tr>
          <tr>
            <LeftColumnStyle>Date:</LeftColumnStyle>
            <RightColumnStyle>{`${moment.unix(date).format('Do MMMM YYYY, H:mm:ss')}`}</RightColumnStyle>
          </tr>
          {labelsString && (
            <tr>
              <LeftColumnStyle>Labels:</LeftColumnStyle>
              <RightColumnStyle>{labelsString}</RightColumnStyle>
            </tr>
          )}
        </tbody>
      </TableStyle>
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
    const { commits, commiters, branches } = this.props

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
        <Pane size={200} minSize="50px" maxSize="100%">
          <History commits={commits} commiters={commiters} branches={branches} onRowClick={this.onRowClick} />
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
