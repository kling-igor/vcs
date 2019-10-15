import React from 'react'
import { observer } from 'mobx-react'

import { RemoteItemList } from './item-list'

const RemotesList = observer(({ storage: { remotes }, onContextMenu }) => {
  return <RemoteItemList items={remotes} onItemSelect={() => {}} onContextMenu={onContextMenu} />
})

export default RemotesList
