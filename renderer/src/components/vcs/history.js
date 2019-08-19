import React, { memo, useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { List, AutoSizer, ScrollSync } from 'react-virtualized'
import moment from 'moment'

import { Tree } from './tree'
import { ROW_HEIGHT, X_STEP } from './constants'

const RowStyle = styled.div`
  padding-left: 20px;
  height: ${() => `${ROW_HEIGHT}px`};

  color: black;
  background-color: ${({ odd }) => (odd ? '#f0f0f0' : 'white')};
  :hover {
    color: white;
    background-color: #0098d4;
  }
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const TextStyle = styled.span`
  margin-left: ${({ offset }) => `${offset}px`};
  font-size: 12px;
  line-height: ${() => `${ROW_HEIGHT}px`};
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
`

const TimeStampStyle = styled.span`
  padding-right: 32px;
  font-size: 12px;
  line-height: ${() => `${ROW_HEIGHT}px`};
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
`

const BadgeStyle = styled.span`
  margin-top: 2px;
  margin-left: 8px;
  margin-right: 16px;
  float: left;
  position: relative;
  width: auto;
  height: 16px;
  padding: 0 6px;
  line-height: 16px;
  background: #137cbd;
  color: #fff;
  font-size: 10px;
  font-weight: 100;
  text-decoration: none;
  font-family: Arial, Helvetica, sans-serif;
  border-bottom-left-radius: 3px;
  border-top-left-radius: 3px;

  ::before {
    content: '';
    position: absolute;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;

    right: -8px;
    border-color: transparent transparent transparent #137cbd;
    border-width: 8px 0 8px 8px;
  }
`

const BranchStyle = styled.span`
  background-color: greenyellow;
  color: black;
  padding-left: 2px;
  padding-right: 2px;
  border-color: black;
  border-width: 1px;
  border-radius: 3px;
  border-style: solid;
  margin-right: 4px;
`
// TODO: useContext onRowClick

export const History = memo(({ commits = [], commiters = [], refs = [], onRowClick, onContextMenu }) => {
  const onClickHandler = useCallback(event => onRowClick(event.currentTarget.dataset.sha), [onRowClick])
  const onContextMenuHandler = useCallback(event => onContextMenu(event.currentTarget.dataset.sha), [onContextMenu])

  const rowRenderer = ({ index, isScrolling, key, style }) => {
    const { sha, message, routes, commiter, date } = commits[index]
    const offset = routes.length > 0 ? routes.length : 1

    // // подсчет кол-ва параллельных роутов
    // let offset = routes.reduce((result, route) => {
    //   const [from, to] = route
    //   if (from === to) return result + 1

    //   return result
    // }, 0)

    // if (offset === 0) {
    //   offset = 1
    // }

    const datetime = moment.unix(date).format('MMMM Do YYYY, H:mm:ss')

    if (!sha) {
      return (
        <RowStyle key={key} style={style} odd={index % 2} onClick={onClickHandler} onContextMenu={onContextMenuHandler}>
          <TextStyle offset={offset * X_STEP}>
            <b>{message}</b>
          </TextStyle>
          <TimeStampStyle>{datetime}</TimeStampStyle>
        </RowStyle>
      )
    }

    const { name, email } = commiters[commiter]
    const commitRefs = refs.filter(item => item.sha === sha)

    return (
      <RowStyle
        key={key}
        style={style}
        odd={index % 2}
        onClick={onClickHandler}
        onContextMenu={onContextMenuHandler}
        data-sha={sha}
      >
        <TextStyle offset={offset * X_STEP}>
          <b className="bp3-monospace-text">{sha.slice(0, 8)}</b>{' '}
          <em>
            {name} {email}
          </em>{' '}
          {!!commitRefs.length > 0 && commitRefs.map(item => <BranchStyle key={item.name}>{item.name}</BranchStyle>)}
          <b>{message}</b>
        </TextStyle>
        <TimeStampStyle>{datetime}</TimeStampStyle>
      </RowStyle>
    )
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <ScrollSync>
          {({ clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => (
            <div className="Table">
              <div className="LeftColumn">{<Tree height={height} scrollTop={scrollTop} commits={commits} />}</div>
              <div className="RightColumn">
                <List
                  onScroll={onScroll}
                  width={width}
                  height={height}
                  overscanRowCount={1}
                  rowRenderer={rowRenderer}
                  rowCount={commits.length}
                  rowHeight={ROW_HEIGHT}
                  // scrollToIndex={scrollToIndex}
                />
              </div>
            </div>
          )}
        </ScrollSync>
      )}
    </AutoSizer>
  )
})
