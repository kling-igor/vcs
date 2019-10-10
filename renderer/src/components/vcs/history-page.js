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
      storage: {
        getCommits,
        commitsCount,
        committers,
        heads,
        maxOffset,
        remoteHeads,
        tags,
        originalFile,
        modifiedFile,
        onCommitSelect,
        selectedCommit,
        isProcessingGitLog,
        headCommit,
        treeChanges
      },
      workspace: { textEditorDidMount }
    } = this.props

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={this.setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <History
            getCommits={getCommits}
            commitsCount={commitsCount}
            committers={committers}
            heads={heads}
            maxOffset={maxOffset}
            remoteHeads={remoteHeads}
            tags={tags}
            onCommitSelect={onCommitSelect}
            onContextMenu={this.props.onContextMenu}
            selectedCommit={selectedCommit}
            isProcessingGitLog={isProcessingGitLog}
            headCommit={headCommit}
            treeChanges={treeChanges}
          />
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} textEditorDidMount={textEditorDidMount} />
        </Pane>
      </SplitPane>
    )
  }
}

export default HistoryPage
