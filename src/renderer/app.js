const { ipcRenderer } = window.require('electron')
const { callMain, answerMain } = require('./ipc').default(ipcRenderer)

import React, { PureComponent, useRef, useEffect } from 'react'

import styled, { createGlobalStyle } from 'styled-components'
// import queue from 'async/queue'

import { List, AutoSizer, InfiniteLoader, ScrollSync } from 'react-virtualized'

// let branchIndex = 0
// const reserve = []
// const branches = {}

// const getBranch = sha => {
//   if (branches[sha] == null) {
//     branches[sha] = branchIndex
//     reserve.push(branchIndex)
//     branchIndex += 1
//   }

//   return branches[sha]
// }

// const fillRoutes = (from, to, iterable) => iterable.map((branch, index) => [from(index), to(index), branch])

// const processCommits = commits => {
//   console.log('PROCESS COMMITS:', commits)

//   return commits.map(commit => {
//     console.log('COMMIT:', commit)
//     const { sha, parents } = commit
//     const [parent, otherParent] = parents

//     const branch = getBranch(sha)
//     const offset = reserve.indexOf(branch)
//     let routes = []

//     if (parents.length === 1) {
//       if (branches[parent] != null) {
//         // create branch
//         routes = [
//           ...fillRoutes(i => i + offset + 1, i => i + offset + 1 - 1, reserve.slice(offset + 1)),
//           ...fillRoutes(i => i, i => i, reserve.slice(0, offset))
//         ]

//         reserve.splice(reserve.indexOf(branch), 1)
//         routes = [...routes, [offset, reserve.indexOf(branches[parent]), branch]]
//       } else {
//         // straight
//         routes = [...fillRoutes(i => i, i => i, reserve)]
//         branches[parent] = branch
//       }
//     } else if (parents.length === 2) {
//       // merge branch
//       branches[parent] = branch

//       routes = fillRoutes(i => i, i => i, reserve)

//       const otherBranch = getBranch(otherParent)

//       routes = [...routes, [offset, reserve.indexOf(otherBranch), otherBranch]]
//     }

//     return { sha, offset, branch, routes }
//   })
// }

const ROW_HEIGHT = 20

const X_STEP = 15
const Y_STEP = ROW_HEIGHT

const CANVAS_WIDTH = 512
// const CANVAS_HEIGHT = 400 + 30
const LINE_WIDTH = 2
const COMMIT_RADIUS = 5

const colors = [
  '#0098d4',
  '#b36305',
  '#e32017',
  '#ffd300',
  '#00782a',
  '#f3a9bb',
  '#a0a5a9',
  '#9b0056',
  '#003688',
  '#000000',
  '#95cdba',
  '#00a4a7',
  '#ee7c0e',
  '#84b817'
]

const branchColor = branch => colors[branch] || 'black'

const yPositionForIndex = yIndex => (yIndex + 0.5) * Y_STEP

const xPositionForIndex = xIndex => (xIndex + 1) * X_STEP

const drawCommit = (ctx, topOffset, commit, yIndex) => {
  const { offset } = commit

  // Thicker lines for the circles, or they look odd
  ctx.lineWidth = LINE_WIDTH * 2

  const x = xPositionForIndex(offset) // Positioning of commit circle
  const y = yPositionForIndex(yIndex) + topOffset
  const innerRadius = COMMIT_RADIUS - LINE_WIDTH

  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#000000'
  ctx.beginPath()
  ctx.arc(x, y, innerRadius, 0, 2 * Math.PI) // Draw a circle
  ctx.stroke() // Draw the outer line
  ctx.fill() // Fill the inner circle
}

const drawRoute = (ctx, topOffset, route, yIndex) => {
  const [from, to, branch] = route

  // Starting position for route
  const fromX = xPositionForIndex(from)
  const fromY = yPositionForIndex(yIndex) + topOffset

  // Ending position for route
  const toX = xPositionForIndex(to)
  const toY = yPositionForIndex(yIndex + 1) + topOffset

  ctx.strokeStyle = branchColor(branch) // Gets a colour based on the branch no.
  ctx.lineWidth = LINE_WIDTH

  ctx.beginPath()
  ctx.moveTo(fromX, fromY) // Place the cursor at the start point

  if (fromX === toX) {
    ctx.lineTo(toX, toY) // Draw a line to the finish point
  } else {
    ctx.bezierCurveTo(fromX - X_STEP / 4, fromY + Y_STEP / 2, toX + X_STEP / 4, toY - Y_STEP / 2, toX, toY)
  }

  ctx.stroke()
}

const drawGraph = (ctx, topOffset, nodes) => {
  // ctx.beginPath()
  // ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  // ctx.fillStyle = 'yellow'
  // ctx.fill()

  nodes.forEach((node, yIndex) => {
    // Draw the routes for this node
    node.routes.forEach(route => drawRoute(ctx, topOffset, route, yIndex))

    // Draw the commit on top of the routes
    drawCommit(ctx, topOffset, node, yIndex)
  })
}

const GlobalStyle = createGlobalStyle`
  .List {
    width: 100%;
    border: 1px solid #DDD;
    margin-top: 15px;
  }
`
const RowStyle = styled.div`
  padding-left: 30px;
  height: ${() => `${ROW_HEIGHT}px`};

  color: black;
  background-color: ${({ odd }) => (odd ? '#e0e0e0' : 'white')};
  :hover {
    color: white;
    background-color: blue;
  }
`

const TextStyle = styled.span`
  margin-left: ${({ offset }) => `${offset}px`};
  font-size: 12px;
  line-height: ${() => `${ROW_HEIGHT}px`};
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
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

// class Tree extends PureComponent {
//   render() {
//     const { scrollTop } = this.props
//     // console.log('scrollTop:', scrollTop)

//     return <div> </div>
//   }
// }

/**
 *
 * @param {Number} scrollTop - смещение
 * @param {Number} height - видимая высота рисования
 * @param {Array} commits - данные для отображения
 */
const Tree = ({ scrollTop, height, commits }) => {
  const canvasRef = useRef(null)
  let topOffset = 0
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_WIDTH, height)

    const skip = Math.floor(scrollTop / ROW_HEIGHT)
    const count = Math.floor(height / ROW_HEIGHT) + 2
    topOffset = -scrollTop % ROW_HEIGHT

    const drawingCommits = commits.slice(skip, skip + count)

    drawGraph(ctx, topOffset, drawingCommits /*processCommits(commits)*/) // тут имеет смысл передавать смещение и высчитанное кол-ов отображаемых коммитов чтобы не процессить ненужные
    // имеем смысл также не процессить каждый раз а только в тот момент когда в этом есть необходимость (поменялась структура дерева)
  }, [scrollTop, height, commits])

  // ширина может быть высчитанна в результате препроцессинга (для отображаемого диапазона может быть определено максимальное кол-во параллельно идущих веток)

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={height}
      style={{ zIndex: 9999, position: 'absolute', left: 0, top: 0 }}
    />
  )
}

export default class App extends PureComponent {
  list = []
  state = {
    showScrollingPlaceholder: false,
    totalRowCount: 0
  }

  // constructor(props) {
  //   super(props)

  //   // callMain('gitlog', 10).then(data => {
  //   //   if (data) {
  //   //     console.log('data:', data)
  //   //     this.setState(({ list }) => ({
  //   //       list: [...list, ...data]
  //   //     }))
  //   //   }
  //   // })
  // }

  async componentDidMount() {
    // super.componentDidMount()

    const data = await callMain('gitlog')
    // console.log('DATA:', data)

    if (data) {
      this.list = data
      this.setState({ totalRowCount: data.length })
    }
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

    // if (!this.isRowLoaded({ index })) {
    //   return (
    //     <RowStyle key={key} style={style}>
    //       <div>
    //         <NameStyle>Loading...</NameStyle>
    //       </div>
    //     </RowStyle>
    //   )
    // }

    const { sha, message, routes } = this.list[index]

    // TODO: тут передавать смещение чтобы менять marginLeft для TextStyle

    return (
      <RowStyle key={key} style={style} odd={index % 2}>
        <TextStyle offset={(routes.length - 1) * X_STEP}>
          <b>{sha}</b> {message}
        </TextStyle>
      </RowStyle>
    )
  }

  noRowsRenderer() {
    return <NoRowsStyle>No rows</NoRowsStyle>
  }

  // isRowLoaded = ({ index }) => {
  //   return !!this.list[index]
  // }

  // loadMoreRows = async ({ startIndex, stopIndex }) => {
  //   // console.log('loadMoreRows:', startIndex, stopIndex)

  //   return new Promise(async resolve => {
  //     const data = await callMain('gitlog', stopIndex - startIndex + 1)
  //     // console.log('DATA:', data)

  //     if (data) {
  //       this.list = [...this.list, ...data]
  //       this.setState(({ totalRowCount }) => {
  //         if (totalRowCount === stopIndex + 1) {
  //           // console.log('BINGO')
  //           return { totalRowCount: totalRowCount + 1 }
  //         }
  //       })
  //     }

  //     resolve()
  //   })

  //   // console.log('loadMoreRows:', startIndex, stopIndex)

  //   // const data = await callMain('gitlog', 10)

  //   // if (data) {
  //   //   this.setState(({ totalRowCount, list }) => {
  //   //     const retValue = {
  //   //       list: [...list, ...data]
  //   //     }

  //   //     if (totalRowCount === stopIndex + 1) {
  //   //       retValue.totalRowCount = totalRowCount + 1
  //   //     }

  //   //     return retValue
  //   //   })
  //   // }
  // }

  render() {
    return (
      <>
        <GlobalStyle />
        <div style={{ height: '100%' }}>
          <AutoSizer>
            {({ width, height }) => (
              // <InfiniteLoader
              //   isRowLoaded={this.isRowLoaded}
              //   loadMoreRows={this.loadMoreRows}
              //   rowCount={this.state.totalRowCount} /* total rows count */
              // >
              // {({ onRowsRendered, registerChild }) => (
              <ScrollSync>
                {({ clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }) => (
                  <div className="Table">
                    <div className="LeftColumn">
                      {<Tree height={height} scrollTop={scrollTop} commits={this.list} />}
                    </div>
                    <div className="RightColumn">
                      <List
                        onScroll={onScroll}
                        // onRowsRendered={onRowsRendered}
                        // ref={registerChild}
                        width={width}
                        height={height}
                        overscanRowCount={1}
                        rowRenderer={this.rowRenderer}
                        // noRowsRenderer={this.noRowsRenderer}
                        rowCount={this.state.totalRowCount} /* INT_MAX if unknown */
                        rowHeight={/*useDynamicRowHeight ? this._getRowHeight : 50*/ ROW_HEIGHT}
                        // scrollToIndex={scrollToIndex}
                      />
                    </div>
                  </div>
                )}
              </ScrollSync>
              // )}
              // </InfiniteLoader>
            )}
          </AutoSizer>
        </div>
      </>
    )
  }
}
