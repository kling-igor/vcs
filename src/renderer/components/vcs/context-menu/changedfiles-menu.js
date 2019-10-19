const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, project, Dialog }) => filePath => {
  const { pendingOperation } = vcs
  const { status } = vcs.changedFiles.find(item => `${item.path}/${item.filename}` === filePath)

  workspace.showContextMenu({
    items: [
      {
        label: `Add to index`,
        click: () => {
          Dialog.confirmStageFile()
            .then(() => {
              console.log('STAGING ', filePath)
              vcs.stageFile(filePath, status)
            })
            .catch(noop)
        },
        enabled: status !== 'C'
      },
      {
        label: `Remove`,
        click: () => {
          if (status === 'A') {
            Dialog.confirmFileRemoveUntracked(filePath)
              .then(async () => {
                console.log('REMOVING ', filePath)
                await project.removeFile(filePath.replace(/^(\.\/)+/, ''))
                await vcs.status()
              })
              .catch(noop)
          } else {
            Dialog.confirmFileRemove(filePath)
              .then(async () => {
                console.log('REMOVING ', filePath)
                await project.removeFile(filePath.replace(/^(\.\/)+/, ''))
                await vcs.status()
              })
              .catch(noop)
          }
        },
        enabled: status !== 'C'
      },
      {
        label: `Stop tracking`,
        click: () => {
          Dialog.confirmFileStopTracking(filePath)
            .then(async () => {
              console.log('STOP TRACKING ', filePath)
              await vcs.stopTracking(filePath)
            })
            .catch(noop)
        },
        enabled: status !== 'C'
      },
      {
        label: `Discard Changes`,
        click: () => {
          Dialog.confirmDiscardFileChanges(filePath)
            .then(() => {
              console.log('DISCARDING FILE CHANGES ', filePath)
              vcs.discardLocalChanges(filePath)
            })
            .catch(noop)
        },
        enabled: status !== 'C'
      },
      // {
      //   label: `Ignore...`,
      //   click: () => {}
      // },
      {
        type: 'separator'
      },
      {
        label: 'Resolve Conflicts',
        enabled: status === 'C',
        submenu: [
          {
            label: "Resolve Using 'Mine'",
            click: () => {
              Dialog.confirmResolveConflictsUsingMine(filePath)
                .then(async () => {
                  await vcs.resolveUsingMine(filePath)
                })
                .catch(noop)
            }
          },
          {
            label: "Resolve Using 'Theirs'",
            click: () => {
              Dialog.confirmResolveConflictsUsingTheirs(filePath)
                .then(async () => {
                  await vcs.resolveUsingTheirs(filePath)
                })
                .catch(noop)
            }
          }
          // {
          //   type: 'separator'
          // },
          // {
          //   label: 'Restart Merge',
          //   click: () => {}
          // },
          // {
          //   label: 'Mark Resolved',
          //   click: () => {
          //     Dialog.confirmMarkResolved(filePath)
          //       .then(async () => {})
          //       .catch(noop)
          //   }
          // },
          // {
          //   label: 'Mark Unresolved',
          //   click: () => {
          //     Dialog.confirmMarkUnresolved(filePath)
          //       .then(async () => {})
          //       .catch(noop)
          //   }
          // }
        ]
      },
      {
        type: 'separator'
      },
      {
        label: `Copy Path to Clipboard`,
        click: () => {
          console.log('COPYING TO CLIPBOARD:', filePath)
          remote.clipboard.writeText(filePath)
        }
      }
    ]
  })
}
