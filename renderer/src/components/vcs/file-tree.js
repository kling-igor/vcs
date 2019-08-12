import React, { memo } from 'react'
import styled from 'styled-components'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

export const FileTree = memo(({ commitInfo }) => {
  if (!commitInfo) return null
  const { paths } = commitInfo
  return (
    <RootStyle style={{ backgroundColor: 'yellow', overflow: 'auto' }}>
      <ul style={{ listStyle: 'none', paddingInlineStart: 0, padding: 0, margin: 0 }}>
        {paths.map(({ oldPath }) => (
          <li key={oldPath} style={{ paddingLeft: 8, paddingRight: 8 }}>
            {oldPath}
          </li>
        ))}
      </ul>
    </RootStyle>
  )
})
