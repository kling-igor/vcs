const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => path => {
  workspace.showContextMenu({
    items: [
      {
        label: `Add to index`,
        click: () => {
          Dialog.confirmStageFile()
            .then(() => {
              console.log('STAGING ', path)
              vcs.stageFile(path)
            })
            .catch(noop)
        }
      },
      {
        label: `Remove`,
        click: () => {
          Dialog.confirmFileRemove(path)
            .then(() => {
              console.log('REMOVING ', path)
            })
            .catch(noop)
        }
      },
      {
        label: `Stop tracking`,
        click: () => {
          Dialog.confirmFileStopTracking(path)
            .then(() => {
              console.log('STOP TRACKING ', path)
            })
            .catch(noop)
        }
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
        }
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
        submenu: [
          {
            label: "Resolve Using 'Mine'",
            click: () => {}
          },
          {
            label: "Resolve Using 'Theirs'",
            click: () => {}
          },
          {
            type: 'separator'
          },
          {
            label: 'Restart Merge',
            click: () => {}
          },
          {
            label: 'Mark Resolved',
            click: () => {}
          },
          {
            label: 'Mark Unresolved',
            click: () => {}
          }
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
