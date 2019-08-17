import React, { Component, memo, useCallback, useState, useEffect } from 'react'
import SplitPane, { Pane } from '../react-split'
import styled from 'styled-components'

import { History } from './history'
import { CommitInfoPane } from './commit-info'
import { DiffPane } from './diff-pane'
import { FileTree } from './file-tree'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

// const onMainSplitResize = layout => {
//   console.log(layout)
// }

const onSecondarySplitResize = layout => {
  console.log(layout)
}

const HistoryPage = memo(
  ({
    commits,
    commiters,
    refs,
    onCommitSelect,
    onPathSelect,
    originalFile,
    modifiedFile,
    layout: { primary = ['200', '200'], secondary = ['200', '200'], inner = ['200', '200'] } = {},
    onLayoutChange = () => {}
  }) => {
    const [commitInfo, setCommitInfo] = useState(null)

    const [mainLayout, setMainLayout] = useState(primary)
    const [secondaryLayout, setSecondaryLayout] = useState(secondary)
    const [innerLayout, setInnerLayout] = useState(inner)

    useEffect(() => {
      const serialized = { primary: mainLayout, secondary: secondaryLayout, inner: innerLayout }
      console.log('serialized:', serialized)
      onLayoutChange(serialized)
    }, [mainLayout, secondaryLayout, innerLayout])

    const onRowClick = useCallback(
      async sha => {
        if (sha) {
          const info = await onCommitSelect(sha)
          setCommitInfo(info)
        }
      },
      [onCommitSelect]
    )

    const onFilePathClick = useCallback(
      async path => {
        await onPathSelect(path)
      },
      [onPathSelect]
    )

    const upperSize = +mainLayout[0] / 100
    const lowerSize = +mainLayout[1] / 100

    const leftSize = +secondaryLayout[0] / 100
    const rightSize = +secondaryLayout[1] / 100

    const upperInnerSize = +innerLayout[0] / 100
    const lowerInnerSize = +innerLayout[1] / 100

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={setMainLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <History commits={commits} commiters={commiters} refs={refs} onRowClick={onRowClick} />
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={setSecondaryLayout}>
            <Pane size={leftSize} minSize="200px" maxSize="100%">
              <RootStyle style={{ background: 'magenta' }}>
                <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={setInnerLayout}>
                  <Pane size={upperInnerSize} minSize="50px" maxSize="100%">
                    <FileTree commitInfo={commitInfo} onSelect={onFilePathClick} />
                  </Pane>
                  <Pane size={lowerInnerSize} minSize="50px" maxSize="100%">
                    <CommitInfoPane commitInfo={commitInfo} />
                  </Pane>
                </SplitPane>
              </RootStyle>
            </Pane>
            <Pane size={rightSize} minSize="400px" maxSize="100%">
              <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} />
            </Pane>
          </SplitPane>
        </Pane>
      </SplitPane>
    )
  }
)

export default HistoryPage
