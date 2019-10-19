const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, project, Dialog }) => path => {
  const { pendingOperation } = vcs
  const { status } = vcs.changedFiles.find(item => `${item.path}/${item.filename}` === path)

  workspace.showContextMenu({
    items: [
      {
        label: `Add to index`,
        click: () => {
          Dialog.confirmStageFile()
            .then(() => {
              console.log('STAGING ', path)
              vcs.stageFile(path, status)
            })
            .catch(noop)
        },
        enabled: status !== 'C'
      },
      {
        label: `Remove`,
        click: () => {
          if (status === 'A') {
            Dialog.confirmFileRemoveUntracked(path)
              .then(async () => {
                console.log('REMOVING ', path)
                await project.removeFile(path.replace(/^(\.\/)+/, ''))
                await vcs.status()
              })
              .catch(noop)
          } else {
            Dialog.confirmFileRemove(path)
              .then(async () => {
                console.log('REMOVING ', path)
                await project.removeFile(path.replace(/^(\.\/)+/, ''))
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
          Dialog.confirmFileStopTracking(path)
            .then(async () => {
              console.log('STOP TRACKING ', path)
              await vcs.stopTracking(path)
            })
            .catch(noop)
        },
        enabled: status !== 'C'
      },
      {
        label: `Discard Changes`,
        click: () => {
          Dialog.confirmDiscardFileChanges(path)
            .then(() => {
              console.log('DISCARDING FILE CHANGES ', path)
              vcs.discardLocalChanges(path)
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
              Dialog.confirmResolveConflictsUsingMine(path)
                .then(async () => {
                  await vcs.resolveUsingMine(path)
                })
                .catch(noop)
            }
          },
          {
            label: "Resolve Using 'Theirs'",
            click: () => {
              Dialog.confirmResolveConflictsUsingTheirs(path)
                .then(async () => {
                  await vcs.resolveUsingTheirs(path)
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
          //     Dialog.confirmMarkResolved(path)
          //       .then(async () => {})
          //       .catch(noop)
          //   }
          // },
          // {
          //   label: 'Mark Unresolved',
          //   click: () => {
          //     Dialog.confirmMarkUnresolved(path)
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
          console.log('COPYING TO CLIPBOARD:', path)
          remote.clipboard.writeText(path)
        }
      }
    ]
  })
}
