import React from 'react'
import { observer } from 'mobx-react'
import FileList from './filelist'

const StagedFiles = observer(({ storage: { stagedFiles, onStagedFilesChanged } }) => {
  return <FileList files={stagedFiles} onSelectionChanged={onStagedFilesChanged} caption="Path" />
})

export default StagedFiles
