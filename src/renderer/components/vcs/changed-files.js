/** @description Компонент для отображения списка измененных файлов в рабочем каталоге */
import React from 'react'
import { observer } from 'mobx-react'
import FileList from './file-list'

const ChangedFiles = observer(
  ({ storage: { changedFiles, selectedChangedFile, onChangedFilesChanged, onChangedFileSelect }, onContextMenu }) => {
    return (
      <FileList
        files={changedFiles}
        selectedItem={selectedChangedFile}
        onItemSelect={onChangedFileSelect}
        onSelectionChanged={onChangedFilesChanged}
        onContextMenu={onContextMenu}
      />
    )
  }
)

export default ChangedFiles
