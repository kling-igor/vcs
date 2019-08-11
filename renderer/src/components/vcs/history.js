import React, { memo } from 'react'
import styled from 'styled-components'
import { List, AutoSizer, ScrollSync } from 'react-virtualized'
import moment from 'moment'

import { Tree } from './tree'
import { ROW_HEIGHT, X_STEP } from './constants'

const RowStyle = styled.div`
  padding-left: 30px;
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

export const History = memo(({ commits = [], commiters = [] }) => {
  const rowRenderer = ({ index, isScrolling, key, style }) => {
    const { sha, message, routes, commiter, date } = commits[index]

    const { name, email } = commiters[commiter]
    const datetime = moment.unix(date).format('MMMM Do YYYY, H:mm:ss')

    return (
      <RowStyle key={key} style={style} odd={index % 2}>
        <TextStyle offset={(routes.length - 1) * X_STEP}>
          <b>{sha}</b>{' '}
          <em>
            {name} {email}
          </em>{' '}
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
