import React from 'react'
import { observer } from 'mobx-react'

import FileList from './file-list'

const StagedFiles = observer(
  ({ storage: { stagedFiles, selectedStagedFile, onStagedFilesChanged, onStagedFileSelect }, onContextMenu }) => {
    return (
      <FileList
        files={stagedFiles}
        selectedItem={selectedStagedFile}
        onItemSelect={onStagedFileSelect}
        onSelectionChanged={onStagedFilesChanged}
        onContextMenu={onContextMenu}
      />
    )
  }
)

export default StagedFiles
