import React from 'react'
import { observer } from 'mobx-react'

import FileList from './file-list'

const StagedFiles = observer(
  ({ storage: { stagedFiles, onStagedFilesChanged, onStagedFileSelect }, onContextMenu }) => {
    return (
      <FileList
        files={stagedFiles}
        onItemSelect={onStagedFileSelect}
        onSelectionChanged={onStagedFilesChanged}
        onContextMenu={onContextMenu}
      />
    )
  }
)

export default StagedFiles
