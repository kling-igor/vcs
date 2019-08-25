import React, { Component } from 'react'
import { observer, inject } from 'mobx-react'

import HistoryPage from './history-page'

@observer
class VCSView extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <HistoryPage storage={this.props.storage} />
      </div>
    )
  }
}

export default VCSView
