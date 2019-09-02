import { action } from 'mobx'

export default ({ vcs, workspace }) => () => {
  const { stagedFiles, unstageSelectedFiles, unstageAllFiles, selectAllFiles, unselectAllFiles, inverseSelection } = vcs

  const hasStagedFiles = stagedFiles.length > 0
  const selectedStagedFilesCount = stagedFiles.reduce((acc, { selected }) => (acc + selected ? 1 : 0), 0)

  workspace.showContextMenu({
    items: [
      {
        label: 'Select All',
        click: action(() => {
          vcs.stagedFiles = selectAllFiles(stagedFiles)
        }),
        enabled: hasStagedFiles
      },
      {
        label: 'Unselect All',
        click: action(() => {
          vcs.stagedFiles = unselectAllFiles(stagedFiles)
        }),
        enabled: hasStagedFiles
      },
      {
        label: 'Inverse Selection',
        click: action(() => {
          vcs.stagedFiles = inverseSelection(stagedFiles)
        }),
        enabled: hasStagedFiles
      },
      {
        type: 'separator'
      },
      {
        label: 'Unstage Selected',
        click: unstageSelectedFiles,
        enabled: hasStagedFiles && selectedStagedFilesCount > 0
      },
      {
        label: 'Unstage All',
        click: unstageAllFiles,
        enabled: hasStagedFiles
      }
    ]
  })
}
