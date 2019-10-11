import React, { memo } from 'react'
import ResizeDetector from 'react-resize-detector'
import styled, { withTheme } from 'styled-components'

import DiffEditor from '../diffeditor'

const BinaryDataRootContainerStyle = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
`

const BinaryDataPaneStyle = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  color: ${({ theme: { type } }) => (type === 'dark' ? '#ffffffaa' : '#000000aa')};
  padding-top: 8px;
  user-select: none;
`

const BinaryDataSplitter = styled.div`
  width: 2px;
  height: 100%;
  display: flex;
  background-color: gray;
`

const BinaryDataDiff = memo(
  withTheme(() => {
    return (
      <BinaryDataRootContainerStyle>
        <BinaryDataPaneStyle>Binary Data</BinaryDataPaneStyle>
        <BinaryDataSplitter />
        <BinaryDataPaneStyle>Binary Data</BinaryDataPaneStyle>
      </BinaryDataRootContainerStyle>
    )
  })
)

export const DiffPane = memo(({ originalFile, modifiedFile, textEditorDidMount }) => {
  if (!originalFile && !modifiedFile) return null

  if (originalFile.type === 'text' || modifiedFile.type === 'text') {
    return (
      <ResizeDetector
        handleWidth
        handleHeight
        refreshMode="debounce"
        refreshRate={500}
        render={({ width, height }) => (
          <DiffEditor
            width={width}
            height={height}
            originalFile={originalFile}
            modifiedFile={modifiedFile}
            textEditorDidMount={textEditorDidMount}
          />
        )}
      />
    )
  }

  return <BinaryDataDiff />
})
