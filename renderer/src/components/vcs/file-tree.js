import React, { memo, useCallback } from 'react'
import styled from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
  background-color: yellow;
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

const ContainerWithScrollbarsStyle = styled(Scrollbars)`
  width: 100%;
  height: 100%;
`

const ScrollBarThumbStyle = styled.div`
  background-color: #424341;
  border-radius: 4px;
`

export const FileTree = memo(({ commitInfo, onSelect }) => {
  if (!commitInfo) return null
  const { paths } = commitInfo

  const onClick = useCallback(event => onSelect(event.currentTarget.dataset.path), [onSelect])

  return (
    <ContainerWithScrollbarsStyle
      autoHide={true}
      autoHideTimeout={1000}
      autoHideDuration={200}
      thumbMinSize={30}
      renderThumbHorizontal={({ style, ...props }) => <ScrollBarThumbStyle />}
      renderThumbVertical={({ style, ...props }) => <ScrollBarThumbStyle />}
    >
      <RootStyle>
        <ListStyle>
          {paths.map(({ oldPath }) => (
            <ListItemStyle key={oldPath} onClick={onClick} data-path={oldPath}>
              {oldPath}
            </ListItemStyle>
          ))}
        </ListStyle>
      </RootStyle>
    </ContainerWithScrollbarsStyle>
  )
})
