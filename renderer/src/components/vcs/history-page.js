/**
 * Отображение gitlog
 */
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import SplitPane, { Pane } from '../react-split'
import { DiffPane } from './diff-pane'
import { History } from './history'

@observer
class HistoryPage extends Component {
  state = {
    layout: ['20000', '20000']
  }

  setLayout = layout => {
    this.setState({ layout })
  }

  render() {
    const upperSize = +this.state.layout[0] / 100
    const lowerSize = +this.state.layout[1] / 100

    const {
      commits,
      committers,
      heads,
      remoteHeads,
      tags,
      originalFile,
      modifiedFile,
      onCommitSelect,
      selectedCommit,
      isProcessingGitLog
    } = this.props.storage

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={this.setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <History
            commits={commits}
            committers={committers}
            heads={heads}
            remoteHeads={remoteHeads}
            tags={tags}
            onCommitSelect={onCommitSelect}
            onContextMenu={this.props.onContextMenu}
            selectedCommit={selectedCommit}
            isProcessingGitLog={isProcessingGitLog}
          />
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} />
        </Pane>
      </SplitPane>
    )
  }
}

export default HistoryPage
