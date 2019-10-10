import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import { Button } from '@blueprintjs/core'
import styled, { withTheme } from 'styled-components'
import SplitPane, { Pane } from '../react-split'
import { DiffPane } from './diff-pane'
import CommitPane from './commit-pane'

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

@observer
class CommitPage extends Component {
  state = {
    layout: ['20000', '20000']
  }

  setLayout = layout => {
    this.setState({ layout })
  }

  showPreviousCommits = () => {
    const {
      storage: { previousCommits, setCommitMessage }
    } = this.props

    const items = previousCommits.map(item => ({
      label: item,
      click: () => {
        setCommitMessage({
          target: {
            value: item
          }
        })
      }
    }))

    this.props.workspace.showContextMenu({ items })
  }

  render() {
    const upperSize = +this.state.layout[0] / 100
    const lowerSize = +this.state.layout[1] / 100

    const {
      storage: {
        name,
        email,
        commitMessage,
        setCommitMessage,
        previousCommits,
        originalFile,
        modifiedFile,
        diffConflictedFile,
        selectedFilePath,
        onCommit,
        onCancelCommit,
        setAlterUserNameEmail,
        alterName,
        alterEmail
      },
      workspace: { textEditorDidMount }
    } = this.props

    const onSave = () => {
      // selectedFilePath
    }

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={this.setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <RootContainerStyle>
            {diffConflictedFile && (
              <ButtonContainer>
                <Button
                  text="Save"
                  onClick={() => {
                    console.log('Save')
                  }}
                  small
                  style={{ width: 100 }}
                />
              </ButtonContainer>
            )}
            <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} textEditorDidMount={textEditorDidMount} />
          </RootContainerStyle>
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <CommitPane
            name={name}
            email={email}
            onChange={setCommitMessage}
            text={commitMessage}
            previousCommits={previousCommits}
            onShowPreviousCommits={this.showPreviousCommits}
            onCommit={onCommit}
            onCancelCommit={onCancelCommit}
            setAlterUserNameEmail={setAlterUserNameEmail}
            alterName={alterName}
            alterEmail={alterEmail}
          />
        </Pane>
      </SplitPane>
    )
  }
}

export default withTheme(CommitPage)
