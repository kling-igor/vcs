import React, { Component, memo, useCallback, useState } from 'react'
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

const onMainSplitResize = layout => {
  console.log(layout)
}

const onSecondarySplitResize = layout => {
  console.log(layout)
}

const HistoryPage = memo(({ commits, commiters, branches, onCommitSelect, onPathSelect, originalFile }) => {
  const [commitInfo, setCommitInfo] = useState(null)

  const onRowClick = useCallback(
    async sha => {
      const info = await onCommitSelect(sha)
      setCommitInfo(info)
    },
    [onCommitSelect]
  )

  const onFilePathClick = useCallback(
    async path => {
      await onPathSelect(path)
    },
    [onPathSelect]
  )

  return (
    <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
      <Pane size={200} minSize="50px" maxSize="100%">
        <History commits={commits} commiters={commiters} branches={branches} onRowClick={onRowClick} />
      </Pane>
      <Pane size={200} minSize="50px" maxSize="100%">
        <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={onSecondarySplitResize}>
          <Pane size={200} minSize="200px" maxSize="100%">
            <RootStyle style={{ background: 'magenta' }}>
              <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
                <Pane size={200} minSize="50px" maxSize="100%">
                  <FileTree commitInfo={commitInfo} onSelect={onFilePathClick} />
                </Pane>
                <Pane size={200} minSize="50px" maxSize="100%">
                  <CommitInfoPane commitInfo={commitInfo} />
                </Pane>
              </SplitPane>
            </RootStyle>
          </Pane>
          <Pane size={200} minSize="400px" maxSize="100%">
            <DiffPane originalFile={originalFile} />
          </Pane>
        </SplitPane>
      </Pane>
    </SplitPane>
  )
})

export default HistoryPage

// export default class HistoryPage extends Component {
//   state = {
//     commitInfo: null
//   }

//   onRowClick = async sha => {
//     const commitInfo = await this.props.onCommitSelect(sha)
//     this.setState({ commitInfo })
//   }

//   render() {
//     const { commits, commiters, branches } = this.props

//     return (
//       <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
//         <Pane size={200} minSize="50px" maxSize="100%">
//           <History commits={commits} commiters={commiters} branches={branches} onRowClick={this.onRowClick} />
//         </Pane>
//         <Pane size={200} minSize="50px" maxSize="100%">
//           <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={onSecondarySplitResize}>
//             <Pane size={200} minSize="200px" maxSize="100%">
//               <RootStyle style={{ background: 'magenta' }}>
//                 <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={onMainSplitResize}>
//                   <Pane size={200} minSize="50px" maxSize="100%">
//                     <FileTree commitInfo={this.state.commitInfo} />
//                   </Pane>
//                   <Pane size={200} minSize="50px" maxSize="100%">
//                     <CommitInfoPane commitInfo={this.state.commitInfo} />
//                   </Pane>
//                 </SplitPane>
//               </RootStyle>
//             </Pane>
//             <Pane size={200} minSize="400px" maxSize="100%">
//               <DiffPane />
//             </Pane>
//           </SplitPane>
//         </Pane>
//       </SplitPane>
//     )
//   }
// }
