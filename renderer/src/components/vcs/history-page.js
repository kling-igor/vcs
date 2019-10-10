/**
 * Отображение gitlog
 */
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import styled, { withTheme } from 'styled-components'
import { Button } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
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
        treeChanges,
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
              <History
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
                isProcessingGitLog={isProcessingGitLog}
                headCommit={headCommit}
                treeChanges={treeChanges}
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
