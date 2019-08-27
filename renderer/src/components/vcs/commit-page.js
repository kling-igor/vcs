import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'
import SplitPane, { Pane } from '../react-split'
import { DiffPane } from './diff-pane'
import CommitPane from './commit-pane'

@observer
class CommitPage extends Component {
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
        name,
        email,
        commitMessage,
        setCommitMessage,
        previousCommits,
        originalFile,
        modifiedFile,
        onCommit,
        onCancelCommit
      }
    } = this.props

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={this.setLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <DiffPane originalFile={originalFile} modifiedFile={modifiedFile} />
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <CommitPane
            name={name}
            email={email}
            onChange={setCommitMessage}
            text={commitMessage}
            previousCommits={previousCommits}
            onCommit={onCommit}
            onCancelCommit={onCancelCommit}
          />
        </Pane>
      </SplitPane>
    )
  }
}

export default CommitPage
