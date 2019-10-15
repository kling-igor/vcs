/**
 * Отображение gitlog
 */
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import styled, { withTheme } from 'styled-components'
import { Button } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

import CircularProgress from '@material-ui/core/CircularProgress'

import SplitPane, { Pane } from '../react-split'
import { DiffPane } from './diff-pane'
import { History } from './history'

const RootContainerStyle = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const ButtonContainer = styled.div`
  width: 100%;
  height: 32px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 4px;
`

const HistoryContainerWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
`

const ProgressRootStyle = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  top: 0;
  background-color: #00000080;
  z-index: 9999;
`

const menuButtonStyle = { width: '30px', height: '30px', marginRight: '8px', outline: 'none' }

@observer
class HistoryPage extends Component {
  state = {
    layout: ['20000', '20000']
  }

  setLayout = layout => {
    this.setState({ layout })
  }

  render() {
    const upperSize = +this.state.layout[0] / 100
    const lowerSize = +this.state.layout[1] / 100

    const {
      onGitLogSettingsMenu,
      storage: {
        logUpdateTime,
        getCommits,
        commitsCount,
        committers,
        heads,
        maxOffset,
        remoteHeads,
        tags,
        originalFile,
        modifiedFile,
        onCommitSelect,
        selectedCommit,
        isProcessingGitLog,
        headCommit,
        showSHA,
        showDate,
        showAuthor,
        showAuthorType
      },
      workspace: { textEditorDidMount }
    } = this.props

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={this.setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <RootContainerStyle>
            <ButtonContainer>
              <Button small minimal icon={IconNames.MORE} onClick={onGitLogSettingsMenu} style={menuButtonStyle} />
            </ButtonContainer>
            <HistoryContainerWrapper>
              {isProcessingGitLog && (
                <ProgressRootStyle>
                  <CircularProgress size={30} thickness={3} style={{ color: '#137cbd' }} />
                </ProgressRootStyle>
              )}
              <History
                logUpdateTime={logUpdateTime}
                getCommits={getCommits}
                commitsCount={commitsCount}
                committers={committers}
                heads={heads}
                maxOffset={maxOffset}
                remoteHeads={remoteHeads}
                tags={tags}
                onCommitSelect={onCommitSelect}
                onContextMenu={this.props.onContextMenu}
                selectedCommit={selectedCommit}
                headCommit={headCommit}
                showSHA={showSHA}
                showDate={showDate}
                showAuthor={showAuthor}
                showAuthorType={showAuthorType}
              />
            </HistoryContainerWrapper>
          </RootContainerStyle>
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} textEditorDidMount={textEditorDidMount} />
        </Pane>
      </SplitPane>
    )
  }
}

export default withTheme(HistoryPage)