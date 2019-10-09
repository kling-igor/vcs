import React, { memo } from 'react'
import ResizeDetector from 'react-resize-detector'
import DiffEditor from '../diffeditor'

export const DiffPane = memo(({ originalFile = '', modifiedFile = '' }) => {
  if (!originalFile && !modifiedFile) return null

  return (
    <ResizeDetector
      handleWidth
      handleHeight
      refreshMode="debounce"
      refreshRate={500}
      render={({ width, height }) => (
        <DiffEditor width={width} height={height} originalFile={originalFile} modifiedFile={modifiedFile} />
      )}
    />
  )
})
