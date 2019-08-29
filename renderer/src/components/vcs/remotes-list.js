import React from 'react'
import { observer } from 'mobx-react'

import ItemList from './item-list'

const BranchesList = observer(({ storage: { remoteHeads, selectedCommit, onCommitSelect } }) => {
  return <ItemList items={remoteHeads} selectedCommit={selectedCommit} onItemSelect={onCommitSelect} />
})

export default BranchesList
