import React from 'react'
import { observer } from 'mobx-react'

import ItemList from './item-list'

const BranchesList = observer(({ storage: { heads, selectedCommit, onCommitSelect }, onContextMenu }) => {
  return (
    <ItemList
      items={heads}
      selectedCommit={selectedCommit}
      onItemSelect={onCommitSelect}
      onContextMenu={onContextMenu}
    />
  )
})

export default BranchesList
