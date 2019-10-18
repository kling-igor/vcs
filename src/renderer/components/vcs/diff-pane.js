import React, { memo } from 'react'
import ResizeDetector from 'react-resize-detector'
import styled, { withTheme } from 'styled-components'
import { ImageViewer } from '../imageviewer'
import DiffEditor from '../diffeditor'

const RootContainerStyle = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
`

const BinaryDataPaneStyle = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: ${({ theme: { type } }) => (type === 'dark' ? '#ffffffaa' : '#000000aa')};
  padding-top: 8px;
  user-select: none;
`

const PaneSplitter = styled.div`
  width: 2px;
  height: 100%;
  display: flex;
  background-color: gray;
`

const EmptyPane = styled.div`
  width: 100%;
  height: 100%;
`
const BinaryDataPane = memo(({ source: { type, mime } }) => {
  if (!type) {
    return <EmptyPane />
  }
  return (
    <BinaryDataPaneStyle>
      <p>Binary Data</p>
      <p>({mime})</p>
    </BinaryDataPaneStyle>
  )
})

const BinaryDataDiff = memo(
  withTheme(({ original, modified }) => {
    return (
      <RootContainerStyle>
        <BinaryDataPane source={original} />
        <PaneSplitter />
        <BinaryDataPane source={modified} />
      </RootContainerStyle>
    )
  })
)

const ImageDataPane = memo(({ source: { type, content } }) => {
  if (!type) return <EmptyPane />
  return <ImageViewer src={content} />
})

const ImageDiff = memo(({ original, modified }) => {
  return (
    <RootContainerStyle>
      <ImageDataPane source={original} />
      <PaneSplitter />
      <ImageDataPane source={modified} />
    </RootContainerStyle>
  )
})

export const DiffPane = memo(({ originalFile, modifiedFile, textEditorDidMount }) => {
  if (!originalFile && !modifiedFile) return null

  if (originalFile.type === 'text' && modifiedFile.type === 'text') {
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
  } else if (originalFile.type === 'image' || modifiedFile.type === 'image') {
    return <ImageDiff original={originalFile} modified={modifiedFile} />
  }

  return <BinaryDataDiff original={originalFile} modified={modifiedFile} />
})
