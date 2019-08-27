import React from 'react'
import { observer } from 'mobx-react'
import FileList from './filelist'

const ChangedFiles = observer(({ storage: { changedFiles, onChangedFilesChanged } }) => {
  return <FileList files={changedFiles} onSelectionChanged={onChangedFilesChanged} caption="Path" />
})

export default ChangedFiles
