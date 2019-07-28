const { ipcRenderer } = window.require('electron')
import React, { PureComponent } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { List, AutoSizer, InfiniteLoader, ScrollSync } from 'react-virtualized'

const GlobalStyle = createGlobalStyle`
  .List {
    width: 100%;
    border: 1px solid #DDD;
    margin-top: 15px;
  }
`

const RowStyle = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 25px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
`

const ScrollingPlaceholderStyle = styled(RowStyle)`
  color: #ddd;
  font-style: italic;
`

const LetterStyle = styled.div`
  display: inline-block;
  height: 40px;
  width: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 40px;
  color: white;
  font-size: 1.5em;
  margin-right: 25px;
`

const NameStyle = styled.div`
  font-weight: bold;
  margin-bottom: 2px;
`

const IndexStyle = styled.div`
  color: #37474f;
`

const NoRowsStyle = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bdbdbd;
`

class Tree extends PureComponent {
  render() {
    const { scrollTop } = this.props

    console.log('scrollTop:', scrollTop)

    return <div> </div>
  }
}

export default class App extends PureComponent {
  list = []

  state = {
    showScrollingPlaceholder: false
  }

  constructor(props) {
    super(props)

    ipcRenderer.on('gitlog', (event, result) => {
      console.log(result)
    })

    setTimeout(() => {
      ipcRenderer.send('gitlog', 10)
    }, 2000)
  }

  getDatum = index => {
    return this.list[index]
  }

  rowRenderer = ({ index, isScrolling, key, style }) => {
    // const { showScrollingPlaceholder } = this.state

    // if (showScrollingPlaceholder && isScrolling) {
    //   return (
    //     <ScrollingPlaceholderStyle key={key} style={style}>
    //       Scrolling...
    //     </ScrollingPlaceholderStyle>
    //   )
    // }

    if (!this.isRowLoaded({ index })) {
      return (
        <RowStyle key={key} style={style}>
          <div>
            <NameStyle>Loading...</NameStyle>
          </div>
        </RowStyle>
      )
    }

    const datum = this.getDatum(index)

    return (
      <RowStyle key={key} style={style}>
        <LetterStyle
          style={{
            backgroundColor: datum.color
          }}
        >
          {datum.name.charAt(0)}
        </LetterStyle>
        <div>
          <NameStyle>{datum.name}</NameStyle>
          <IndexStyle>This is row {index}</IndexStyle>
        </div>
      </RowStyle>
    )
  }

  noRowsRenderer() {
    return <NoRowsStyle>No rows</NoRowsStyle>
  }

  isRowLoaded = ({ index }) => {
    return !!this.list[index]
  }

  loadMoreRows = ({ startIndex, stopIndex }) => {
    console.log('loadMoreRows:', startIndex, stopIndex)

    return new Promise(resolve => {
      setTimeout(() => {
        for (let i = startIndex; i < stopIndex; i += 1) {
          if (!this.list[i]) {
            this.list.push({
              color: 'green',
              name: `Name:${i}`
            })
          }
        }

        resolve()
      }, 2000)
    })
  }

  render() {
    return (
      <>
        <GlobalStyle />
        <div style={{ height: '400px' }}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <InfiniteLoader
                isRowLoaded={this.isRowLoaded}
                loadMoreRows={this.loadMoreRows}
                rowCount={500} /* total rows count */
              >
                {({ onRowsRendered, registerChild }) => (
                  <ScrollSync>
                    {({ clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => (
                      <div className="Table">
                        <div className="LeftColumn">
                          <Tree scrollTop={scrollTop} />
                        </div>
                        <div className="RightColumn">
                          <List
                            onScroll={onScroll}
                            onRowsRendered={onRowsRendered}
                            ref={registerChild}
                            height={400}
                            // overscanRowCount={10}
                            rowRenderer={this.rowRenderer}
                            // noRowsRenderer={this.noRowsRenderer}
                            rowCount={100} /* INT_MAX if unknown */
                            rowHeight={/*useDynamicRowHeight ? this._getRowHeight : 50*/ 50}
                            // scrollToIndex={scrollToIndex}
                            width={width}
                          />
                        </div>
                      </div>
                    )}
                  </ScrollSync>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </div>
      </>
    )
  }
}
