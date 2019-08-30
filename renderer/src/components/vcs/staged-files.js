import React from 'react'
import { observer } from 'mobx-react'
import FileList from './file-list'

const StagedFiles = observer(({ storage: { stagedFiles, onStagedFilesChanged }, onContextMenu }) => {
  return <FileList files={stagedFiles} onSelectionChanged={onStagedFilesChanged} onContextMenu={onContextMenu} />
})

export default StagedFiles
