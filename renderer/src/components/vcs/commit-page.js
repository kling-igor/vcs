import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import { Button } from '@blueprintjs/core'
import SplitPane, { Pane } from '../react-split'
import { DiffPane } from './diff-pane'
import CommitPane from './commit-pane'

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
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}
          >
            {diffConflictedFile && (
              <div
                style={{
                  width: '100%',
                  height: 32,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingRight: 4
                }}
                className="bp3-dark"
              >
                <Button
                  text="Save"
                  onClick={() => {
                    console.log('Save')
                  }}
                  small
                  style={{ width: 100 }}
                />
              </div>
            )}
            <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} textEditorDidMount={textEditorDidMount} />
          </div>
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

export default CommitPage
