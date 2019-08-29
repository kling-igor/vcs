import React from 'react'
import { observer } from 'mobx-react'
import ItemList from './item-list'

const TagsList = observer(({ storage: { tags, selectedCommit, onCommitSelect } }) => {
  return <ItemList items={tags} selectedCommit={selectedCommit} onItemSelect={onCommitSelect} />
})

export default TagsList
