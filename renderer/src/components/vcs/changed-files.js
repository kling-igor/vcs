import React from 'react'
import { observer } from 'mobx-react'
import FileList from './file-list'

const ChangedFiles = observer(({ storage: { changedFiles, onChangedFilesChanged }, onContextMenu }) => {
  return <FileList files={changedFiles} onSelectionChanged={onChangedFilesChanged} onContextMenu={onContextMenu} />
})

export default ChangedFiles
