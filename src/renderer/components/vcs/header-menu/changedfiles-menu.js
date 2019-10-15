import { action } from 'mobx'

export default ({ vcs, workspace }) => () => {
  const {
    changedFiles,
    stageSelectedFiles,
    stageAllFiles,
    selectAllFiles,
    unselectAllFiles,
    inverseSelection,
    discardAllLocalChanges,
    pendingOperation
  } = vcs
  const hasChangedFiles = changedFiles.length > 0
  const selectedChangesFilesCount = changedFiles.reduce((acc, { selected }) => (acc + selected ? 1 : 0), 0)

  workspace.showContextMenu({
    items: [
      {
        label: 'Select All',
        click: action(() => {
          vcs.changedFiles = selectAllFiles(changedFiles)
        }),
        enabled: hasChangedFiles
      },
      {
        label: 'Unselect All',
        click: action(() => {
          vcs.changedFiles = unselectAllFiles(changedFiles)
        }),
        enabled: hasChangedFiles
      },
      {
        label: 'Inverse Selection',
        click: action(() => {
          vcs.changedFiles = inverseSelection(changedFiles)
        }),
        enabled: hasChangedFiles
      },
      {
        type: 'separator'
      },
      {
        label: 'Stage Selected',
        click: stageSelectedFiles,
        enabled: hasChangedFiles && selectedChangesFilesCount > 0 && !pendingOperation
      },
      {
        label: 'Stage All',
        click: stageAllFiles,
        enabled: hasChangedFiles && !pendingOperation
      },
      {
        label: 'Discard All Changes',
        click: discardAllLocalChanges,
        enabled: hasChangedFiles && !pendingOperation
      }
    ]
  })
}
