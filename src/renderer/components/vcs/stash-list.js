import React from 'react'
import { observer } from 'mobx-react'
import ItemList from './item-list'

const StashList = observer(({ storage: { stashes }, onContextMenu }) => {
  return <ItemList keyKey="index" titleKey="message" items={stashes} onContextMenu={onContextMenu} />
})

export default StashList
