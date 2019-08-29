import React, { memo, useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { List, AutoSizer, ScrollSync } from 'react-virtualized'
import moment from 'moment'

import { Tree } from './tree'
import { ROW_HEIGHT, X_STEP } from './constants'

const RowStyle = styled.div`
  padding-left: 20px;
  height: ${() => `${ROW_HEIGHT}px`};

  background-color: ${({
    odd,
    selected,
    theme: {
      type,
      list: { activeSelectionBackground }
    }
  }) => {
    const oddColor = type === 'light' ? '#e2e2e2' : '#505050'

    return selected ? activeSelectionBackground : odd ? oddColor : 'transparent'
  }};

  color: ${({
    selected,
    theme: {
      list: { activeSelectionForeground, focusForeground }
    }
  }) => {
    return selected ? activeSelectionForeground : focusForeground
  }};

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
    }) => {
      return selected ? activeSelectionForeground : hoverForeground
    }};
  }

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const SvgStyle = styled.svg`
  position: relative;
  top: 4px;
  left: 2px;
  margin-right: 4px;
`

const TagIcon = ({ color = '#fff' }) => (
  <SvgStyle viewBox="0 0 14 16" width={14} height={16} fill={color}>
    <path
      fillRule="evenodd"
      d="M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z"
    ></path>
  </SvgStyle>
)

const BranchIcon = ({ color = '#fff' }) => (
  <SvgStyle width={10} height={16} viewBox="0 0 10 16" fill={color}>
    <path
      fillRule="evenodd"
      d="M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"
    />
  </SvgStyle>
)

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

const TagStyle = styled.span`
  background-color: navy;
  color: white;
  padding-left: 2px;
  padding-right: 2px;
  border-color: black;
  border-width: 1px;
  border-radius: 3px;
  border-style: solid;
  margin-right: 4px;
`

// TODO: useContext onRowClick

export const History = memo(
  ({ commits, commiters, heads, remoteHeads, tags, onCommitSelect, onContextMenu, selectedCommit }) => {
    const onClickHandler = useCallback(event => onCommitSelect(event.currentTarget.dataset.sha), [])
    const onContextMenuHandler = useCallback(event => onContextMenu(event.currentTarget.dataset.sha), [])

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
          <RowStyle
            key={key}
            style={style}
            odd={index % 2}
            onClick={onClickHandler}
            onContextMenu={onContextMenuHandler}
          >
            <TextStyle offset={offset * X_STEP}>
              <b>{message}</b>
            </TextStyle>
            <TimeStampStyle>{datetime}</TimeStampStyle>
          </RowStyle>
        )
      }

      const { name, email } = commiters[commiter]
      const commitRefs = [...heads.filter(item => item.sha === sha), ...remoteHeads.filter(item => item.sha === sha)]
      const commitTags = [...tags.filter(item => item.sha === sha)]

      return (
        <RowStyle
          key={key}
          style={style}
          odd={index % 2}
          onClick={onClickHandler}
          onContextMenu={onContextMenuHandler}
          data-sha={sha}
          selected={sha === selectedCommit}
        >
          <TextStyle offset={offset * X_STEP}>
            <b className="bp3-monospace-text">{sha.slice(0, 8)}</b>{' '}
            <em>
              {name} {email}
            </em>{' '}
            {!!commitTags.length > 0 &&
              commitTags.map(item => (
                <TagStyle key={item.name}>
                  <TagIcon color="#fff" />
                  {item.name}
                </TagStyle>
              ))}
            {!!commitRefs.length > 0 &&
              commitRefs.map(item => (
                <BranchStyle key={item.name}>
                  <BranchIcon color="#000" />
                  {item.name}
                </BranchStyle>
              ))}
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
  }
)
