/**@description Компонент для отображения в dock списков веток, тегов и т.п. */
import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'

const ListItemContainerStyle = styled.li`
  padding: 0;
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

const ListItemNameStyle = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: baseline;
  margin-left: 8px;
  margin-right: 8px;
`

const ListStyle = styled.ul`
  font-size: 13px;
  /* font-family: 'Open Sans', sans-serif; */
  line-height: 1.7em;
  white-space: nowrap;
  padding: 0;
  margin: 0px;
  /* padding-top: 4px;
  padding-bottom: 4px; */
`

const ListRootStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const scrollBarsStyle = { width: '100%', height: '100%' }

const ItemList = ({
  items,
  onItemSelect = () => {},
  selectedKey,
  onContextMenu = () => {},
  keyKey = 'sha',
  titleKey = 'name'
}) => {
  const onClickHandler = useCallback(
    event => onItemSelect(event.currentTarget.dataset.key, event.currentTarget.dataset.name),
    []
  )
  const onContextMenuHandler = useCallback(
    event => onContextMenu(event.currentTarget.dataset.key, event.currentTarget.dataset.title),
    []
  )

  return (
    <ListRootStyle>
      <Scrollbars style={scrollBarsStyle} thumbMinSize={30} autoHide autoHideTimeout={1000} autoHideDuration={200}>
        <ListStyle>
          {items.map(({ [keyKey]: key, [titleKey]: title, decoratedName }) => {
            return (
              <ListItemContainerStyle
                key={key}
                data-key={key}
                data-title={title}
                onClick={onClickHandler}
                onContextMenu={onContextMenuHandler}
                selected={key === selectedKey}
              >
                <ListItemNameStyle>{decoratedName || title}</ListItemNameStyle>
              </ListItemContainerStyle>
            )
          })}
        </ListStyle>
      </Scrollbars>
    </ListRootStyle>
  )
}

export const RemoteItemList = ({ items, onItemSelect, onContextMenu }) => {
  const onClickHandler = useCallback(event => onItemSelect(event.currentTarget.dataset.name), [])
  const onContextMenuHandler = useCallback(event => onContextMenu(event.currentTarget.dataset.name), [])

  return (
    <ListRootStyle>
      <Scrollbars style={scrollBarsStyle} thumbMinSize={30} autoHide autoHideTimeout={1000} autoHideDuration={200}>
        <ListStyle>
          {items.map(({ name, sha }) => {
            return (
              <ListItemContainerStyle
                key={name}
                data-name={name}
                onClick={onClickHandler}
                onContextMenu={onContextMenuHandler}
              >
                <ListItemNameStyle>{name}</ListItemNameStyle>
              </ListItemContainerStyle>
            )
          })}
        </ListStyle>
      </Scrollbars>
    </ListRootStyle>
  )
}

export default ItemList
