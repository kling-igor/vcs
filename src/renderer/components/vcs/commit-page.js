import React, { useState, memo, useCallback, useMemo, useEffect } from 'react'
// import { observer } from 'mobx-react'
import { observer, useObservable, useObserver } from 'mobx-react-lite'
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
`

const buttonStyle = { width: 100, marginRight: 8 }

const DiffPaneContainer = withTheme(
  ({ theme, originalFile, modifiedFile, diffConflictedFile, textEditorDidMount, onSave, onUseOurs, onUseTheirs }) => {
    const [saveButtonDisabled, setSaveButtonDisabled] = useState(false)
    const [oursButtonDisabled, setOursButtonDisabled] = useState(true)
    const [theirsButtonDisabled, setTheirsButtonDisabled] = useState(false)

    useEffect(() => {
      let disposable
      if (modifiedFile && modifiedFile.content && modifiedFile.content.onDidChangeContent) {
        disposable = modifiedFile.content.onDidChangeContent(() => {
          setSaveButtonDisabled(false)
          setOursButtonDisabled(false)
          setTheirsButtonDisabled(false)
        })
      }

      return () => {
        if (disposable) {
          disposable.dispose()
        }
      }
    }, [modifiedFile])

    const onSaveClick = useCallback(() => {
      setSaveButtonDisabled(true)
      setOursButtonDisabled(true)
      setTheirsButtonDisabled(true)

      onSave()
    }, [])

    const onUseOursClick = useCallback(() => {
      setSaveButtonDisabled(false)
      setOursButtonDisabled(true)
      setTheirsButtonDisabled(false)

      onUseOurs()
    }, [])

    const onUseTheirsClick = useCallback(() => {
      setSaveButtonDisabled(false)
      setOursButtonDisabled(false)
      setTheirsButtonDisabled(true)

      onUseTheirs()
    }, [])

    const buttonContainerClassName = theme.type === 'dark' ? 'bp3-dark' : ''

    return useObserver(() => (
      <RootContainerStyle>
        {diffConflictedFile && (
          <ButtonContainer className={buttonContainerClassName}>
            <Button
              text="Theirs"
              disabled={theirsButtonDisabled}
              onClick={onUseTheirsClick}
              small
              style={buttonStyle}
            />
            <Button text="Ours" disabled={oursButtonDisabled} onClick={onUseOursClick} small style={buttonStyle} />
            <Button
              text="Save"
              disabled={saveButtonDisabled}
              intent="primary"
              onClick={onSaveClick}
              small
              style={buttonStyle}
            />
          </ButtonContainer>
        )}
        <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} textEditorDidMount={textEditorDidMount} />
      </RootContainerStyle>
    ))
  }
)

const CommitPage = ({ storage, workspace }) => {
  const [layout, setLayout] = useState(['20000', '20000'])

  const showPreviousCommits = useCallback(() => {
    const {
      workspace,
      storage: { previousCommits, setCommitMessage }
    } = props

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

    workspace.showContextMenu({ items })
  })

  const upperSize = +layout[0] / 100
  const lowerSize = +layout[1] / 100

  return useObserver(() => {
    const {
      name,
      email,
      commitMessage,
      setCommitMessage,
      previousCommits,
      originalFile,
      modifiedFile,
      diffConflictedFile,
      resolveUsingMine,
      resolveUsingTheirs,
      resolveAsIs,
      onCommit,
      onCancelCommit,
      setAlterUserNameEmail,
      alterName,
      alterEmail,
      canCommit
    } = storage

    const { textEditorDidMount } = workspace

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <DiffPaneContainer
            originalFile={originalFile}
            modifiedFile={modifiedFile}
            diffConflictedFile={diffConflictedFile}
            textEditorDidMount={textEditorDidMount}
            onSave={resolveAsIs}
            onUseOurs={resolveUsingMine}
            onUseTheirs={resolveUsingTheirs}
          />
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <CommitPane
            enabled={canCommit}
            name={name}
            email={email}
            onChange={setCommitMessage}
            text={commitMessage}
            previousCommits={previousCommits}
            onShowPreviousCommits={showPreviousCommits}
            onCommit={onCommit}
            onCancelCommit={onCancelCommit}
            setAlterUserNameEmail={setAlterUserNameEmail}
            alterName={alterName}
            alterEmail={alterEmail}
          />
        </Pane>
      </SplitPane>
    )
  })
}

export default CommitPage
