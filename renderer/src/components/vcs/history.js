import React, { memo, useCallback, useEffect, useRef, useMemo, useState } from 'react'
import styled from 'styled-components'
import { List, AutoSizer, ScrollSync, InfiniteLoader } from 'react-virtualized'
import moment from 'moment'

import { Tree } from './tree'
import { ROW_HEIGHT, X_STEP } from './constants'

import colors from './colors'

moment.locale('en', {
  calendar: {
    lastDay: '[Yesterday at] H:mm',
    sameDay: '[Today at] H:mm'
  }
})

const branchColor = branch => colors[branch % colors.length] || 'red'

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
    const oddColor = type === 'light' ? '#e2e2e2' : '#272727' //'#505050'

    return selected ? '#0098d4' : odd ? oddColor : 'transparent'
  }};

  color: ${({
    selected,
    theme: {
      list: { activeSelectionForeground, focusForeground }
    }
  }) => {
    return selected ? '#fff' : focusForeground
  }};

  :hover {
    background-color: ${({
      selected,
      theme: {
        list: { activeSelectionBackground, hoverBackground }
      }
    }) => (selected ? '#0098d4' : hoverBackground)};

    color: ${({
      selected,
      theme: {
        list: { activeSelectionForeground, hoverForeground }
      }
    }) => {
      return selected ? '#fff' : hoverForeground
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
  width: 14px;
`

const TagIcon = ({ color = '#fff' }) => (
  <SvgStyle viewBox="0 0 14 16" width={14} height={16} fill={color}>
    <path
      fillRule="evenodd"
      d="M7.73 1.73C7.26 1.26 6.62 1 5.96 1H3.5C2.13 1 1 2.13 1 3.5v2.47c0 .66.27 1.3.73 1.77l6.06 6.06c.39.39 1.02.39 1.41 0l4.59-4.59a.996.996 0 0 0 0-1.41L7.73 1.73zM2.38 7.09c-.31-.3-.47-.7-.47-1.13V3.5c0-.88.72-1.59 1.59-1.59h2.47c.42 0 .83.16 1.13.47l6.14 6.13-4.73 4.73-6.13-6.15zM3.01 3h2v2H3V3h.01z"
    />
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
  font-size: 13px;
  line-height: ${() => `${ROW_HEIGHT}px`};
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
`

const TimeStampStyle = styled.span`
  padding-right: 16px;
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
  /* background-color: greenyellow; */
  /* color: black; */

  background-color: #383838;
  color: #dbdfff;

  /* padding-left: 2px; */
  padding-right: 4px;
  /* border-color: ${({ theme: { type } }) => (type === 'dark' ? 'white' : 'black')}; */
  border-color: #909090;
  border-width: 1px;
  border-radius: 3px;
  border-style: solid;
  margin-right: 4px;
`

const TagStyle = styled.span`
  /* background-color: #00adff; */
  background-color: #383838;
  color: #dbdfff;
  /* padding-left: 2px; */
  padding-right: 4px;
  /* border-color: ${({ theme: { type } }) => (type === 'dark' ? 'white' : 'black')}; */
  border-color: #909090;
  border-width: 1px;
  border-radius: 3px;
  border-style: solid;
  margin-right: 4px;
`

const BadgeIconContainer = styled.span`
  background-color: ${({ color }) => color};
  width: 16px;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-right: 4px;
`

const RightContainerStyle = styled.div`
  margin: 0px;
  padding: 0px;
  white-space: nowrap;
`

export const History = memo(
  ({
    getCommits,
    commitsCount,
    committers,
    heads,
    maxOffset,
    remoteHeads,
    tags,
    onCommitSelect,
    onContextMenu,
    selectedCommit,
    headCommit,
    treeChanges,
    showSHA,
    showDate,
    showAuthor,
    showAuthorType
  }) => {
    const onClickHandler = useCallback(event => onCommitSelect(event.currentTarget.dataset.sha), [])
    const onContextMenuHandler = useCallback(event => onContextMenu(event.currentTarget.dataset.sha), [])

    // тут будут кешироваться все данные для отображения строк
    const rowsRef = useRef({ rows: [] })

    const listRef = useRef(null)

    const [cachedCommitsCount, setCachedCommitsCount] = useState(0)

    // useEffect(() => {
    //   if (listRef.current) {
    //     listRef.current.forceUpdateGrid()
    //   }
    // }, [treeChanges])

    const isRowLoaded = ({ index }) => !!rowsRef.current.rows[index]

    const loadMoreRows = async ({ startIndex, stopIndex }) => {
      const chunk = await getCommits(startIndex, stopIndex)

      const { rows } = rowsRef.current

      for (let i = startIndex; i <= stopIndex; i++) {
        rows[i] = chunk[i - startIndex]
      }

      setCachedCommitsCount(rows.length)
    }

    const rowRenderer = ({ index, isScrolling, key, style }) => {
      const rowData = rowsRef.current.rows[index]

      if (!rowData) return null

      const { sha, message, routes, committer, date, branch } = rowData

      const badgeColor = branchColor(branch)

      const offset = routes.length > 0 ? routes.length : 1

      let datetime

      if (showDate) {
        datetime = moment(date).isSame(moment(), 'day')
          ? `${moment.duration(moment().diff(date)).humanize()} ago`
          : moment(date).format('MMMM Do YYYY, H:mm')
      }

      if (!sha) {
        return (
          <RowStyle
            key={key}
            style={style}
            odd={index % 2}
            onClick={onClickHandler}
            onContextMenu={onContextMenuHandler}
          >
            <TextStyle offset={offset * X_STEP}>{message}</TextStyle>
            {showDate && <TimeStampStyle>{datetime}</TimeStampStyle>}
          </RowStyle>
        )
      }

      const { name, email } = committers[committer]

      let author = `${name} <${email}>`

      if (showAuthorType === 'ABBREVIATED') {
        const parts = name.split(' ').filter(item => !!item)
        author = parts.reduce((acc, item) => {
          return acc + item.slice(0, 1)
        }, '')
      } else if (showAuthorType === 'FULL_NAME') {
        author = `${name}`
      }

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
            {showSHA && <b className="bp3-monospace-text">{sha.slice(0, 8) + '  '}</b>}
            {!!commitTags.length > 0 &&
              commitTags.map(item => (
                <TagStyle key={item.name}>
                  <BadgeIconContainer color={badgeColor}>
                    <TagIcon color="#000" />
                  </BadgeIconContainer>
                  {item.name}
                </TagStyle>
              ))}
            {!!commitRefs.length > 0 &&
              commitRefs.map(item => {
                let title = item.name
                if (item.behind) {
                  title = `${title} ↓${item.behind}` // v   \u2193
                }
                if (item.ahead) {
                  title = `${title} ↑${item.ahead}` // ^ \u2191
                }
                return (
                  <BranchStyle key={item.name}>
                    <BadgeIconContainer color={badgeColor}>
                      <BranchIcon color="#000" />
                    </BadgeIconContainer>
                    {title}
                  </BranchStyle>
                )
              })}
            {message}
          </TextStyle>
          <RightContainerStyle>
            {showAuthor && <TextStyle>{author + '  '}</TextStyle>}
            {showDate && <TimeStampStyle>{datetime}</TimeStampStyle>}
          </RightContainerStyle>
        </RowStyle>
      )
    }

    return (
      <AutoSizer>
        {({ width, height }) => (
          <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={loadMoreRows} rowCount={commitsCount}>
            {({ onRowsRendered, registerChild }) => {
              registerChild(listRef.current)

              return (
                <ScrollSync>
                  {({ clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => (
                    <div className="Table">
                      <div className="LeftColumn">
                        <Tree
                          height={height}
                          scrollTop={scrollTop}
                          maxOffset={maxOffset}
                          commits={rowsRef.current.rows}
                          commitsCount={cachedCommitsCount}
                          headCommit={headCommit}
                          treeChanges={treeChanges}
                        />
                      </div>
                      <div className="RightColumn" style={{ marginRight: 16 }}>
                        <List
                          // ref={registerChild}
                          ref={listRef}
                          onRowsRendered={onRowsRendered}
                          onScroll={onScroll}
                          width={width}
                          height={height}
                          overscanRowCount={1}
                          rowRenderer={rowRenderer}
                          rowCount={commitsCount}
                          rowHeight={ROW_HEIGHT}
                          // scrollToIndex={scrollToIndex}
                        />
                      </div>
                    </div>
                  )}
                </ScrollSync>
              )
            }}
          </InfiniteLoader>
        )}
      </AutoSizer>
    )
  }
)
