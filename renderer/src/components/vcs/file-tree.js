import React, { memo, useCallback } from 'react'
import styled from 'styled-components'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

const ListStyle = styled.ul`
  list-style: none;
  padding-inline-start: 0px;
  padding: 0px;
  margin: 0px;
`

const ListItemStyle = styled.li`
  padding-left: 8px;
  padding-right: 8px;
  cursor: pointer;
  user-select: none;
  :hover {
    color: white;
    background-color: #0098d4;
  }
`

export const FileTree = memo(({ commitInfo, onSelect }) => {
  if (!commitInfo) return null
  const { paths } = commitInfo

  const onClick = useCallback(event => onSelect(event.target.dataset.path), [onSelect])

  return (
    <RootStyle style={{ backgroundColor: 'yellow', overflow: 'auto' }}>
      <ListStyle>
        {paths.map(({ oldPath }) => (
          <ListItemStyle key={oldPath} onClick={onClick} data-path={oldPath}>
            {oldPath}
          </ListItemStyle>
        ))}
      </ListStyle>
    </RootStyle>
  )
})
