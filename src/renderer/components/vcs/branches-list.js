import React from 'react'
import { observer } from 'mobx-react'

import ItemList from './item-list'

const BranchesList = observer(({ storage: { heads, selectedCommit, onCommitSelect }, onContextMenu }) => {
  const items = heads.map(({ name, sha, ahead, behind }) => {
    let decoratedName = name
    if (behind) {
      decoratedName = `${decoratedName} ↓${behind}` // v
    }
    if (ahead) {
      decoratedName = `${decoratedName} ↑${ahead}` // ^
    }
    return {
      name,
      sha,
      decoratedName
    }
  })

  return (
    <ItemList
      items={items}
      selectedCommit={selectedCommit}
      onItemSelect={onCommitSelect}
      onContextMenu={onContextMenu}
    />
  )
})

export default BranchesList
