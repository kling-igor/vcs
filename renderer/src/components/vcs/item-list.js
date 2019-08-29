import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'

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
  :hover {
    background-color: blue;
    color: white;
  }
`

const ListItemLeftGroupStyle = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: baseline;
`

const ListItemNameStyle = styled.span`
  white-space: nowrap;
`

const ListStyle = styled.ul`
  font-size: 13px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.2em;
  white-space: nowrap;
  padding: 0;
  margin: 0px;
  margin-top: 0px;
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

const ItemList = ({ items }) => {
  return (
    <ListRootStyle>
      <Scrollbars style={scrollBarsStyle} thumbMinSize={30} autoHide autoHideTimeout={1000} autoHideDuration={200}>
        <ListStyle>
          {items.map(({ name, sha }, index) => {
            return (
              <ListItemContainerStyle key={name}>
                <ListItemLeftGroupStyle>
                  <ListItemNameStyle>{name}</ListItemNameStyle>
                </ListItemLeftGroupStyle>
              </ListItemContainerStyle>
            )
          })}
        </ListStyle>
      </Scrollbars>
    </ListRootStyle>
  )
}

export default ItemList
