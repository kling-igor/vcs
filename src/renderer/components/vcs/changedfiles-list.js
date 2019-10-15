/** @description Компонент для отображения списка файлов коммита */

import React, { memo, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import { Scrollbars } from 'react-custom-scrollbars'

import StatusBadge from './status-badge'

const ListRootStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const ListStyle = styled.ul`
  font-size: 13px;
  font-family: 'Roboto', sans-serif;
  line-height: 1.7em;
  white-space: nowrap;
  padding: 0;
  margin: 0px;
  margin-top: 0px;
`

const ListItemContainerStyle = styled.li`
  padding: 0;
  padding-left: 4px;
  padding-right: 8px;
  margin: 0;
  list-style-type: none;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;

  cursor: pointer;
  user-select: none;

  background-color: ${({
    selected,
    theme: {
      list: { activeSelectionBackground }
    }
  }) => (selected ? activeSelectionBackground : 'transparent')};

  color: ${({
    selected,
    theme: {
      list: { activeSelectionForeground, focusForeground }
    }
  }) => (selected ? activeSelectionForeground : focusForeground)};

  :hover {
    background-color: ${({
      selected,
      theme: {
        list: { activeSelectionBackground, hoverBackground }
      }
    }) => (selected ? activeSelectionBackground : hoverBackground)};

    color: ${({
      selected,
      theme: {
        list: { activeSelectionForeground, hoverForeground }
      }
    }) => (selected ? activeSelectionForeground : hoverForeground)};
  }
`

const ListItemLeftGroupStyle = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: baseline;
`

const ListItemFilenameStyle = styled.span`
  white-space: nowrap;
`

const ListItemPathStyle = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  margin-left: 1em;
  opacity: 0.8;
`

const scrollbarsStyle = {
  width: '100%',
  height: '100%'
}

// https://www.git-scm.com/docs/git-status#_short_format
const ChangesFileList = observer(({ storage: { commitInfo, onCommitFileSelect, commitSelectedFile } }) => {
  if (!commitInfo) return null

  const { paths = [] } = commitInfo

  const onClick = event => onCommitFileSelect(event.currentTarget.dataset.path)
  return (
    <ListRootStyle>
      <Scrollbars style={scrollbarsStyle} thumbMinSize={30} autoHide autoHideTimeout={1000} autoHideDuration={200}>
        <ListStyle>
          {paths.map(({ filename, path, status }) => {
            const fullPath = `${path}/${filename}`
            return (
              <ListItemContainerStyle
                key={fullPath}
                data-path={fullPath}
                onClick={onClick}
                selected={fullPath === commitSelectedFile}
              >
                <ListItemLeftGroupStyle>
                  <ListItemFilenameStyle>{filename}</ListItemFilenameStyle>
                  <ListItemPathStyle>{path}</ListItemPathStyle>
                </ListItemLeftGroupStyle>
                {!!status && <StatusBadge value={status} />}
              </ListItemContainerStyle>
            )
          })}
        </ListStyle>
      </Scrollbars>
    </ListRootStyle>
  )
})

export default ChangesFileList
