const { remote } = window.require('electron')
const noop = () => {}
export default ({ vcs, workspace, Dialog }) => sha => {
  if (!sha) return

  const { currentCommit, heads, tags, headCommit, hasLocalChanges, pendingOperation } = vcs

  const branch = heads.find(item => item.sha === sha)
  const tag = tags.find(item => item.sha === sha)

  // TODO: в VCS добавить знание о текущем коммите рабочего каталога

  workspace.showContextMenu({
    items: [
      {
        label: 'Checkout...',
        click: () => {
          let name = sha
          let detachedHead = true
          if (branch) {
            name = branch.name
            detachedHead = false
          } else if (tag) {
            name === tag.name
          }

          if (detachedHead) {
            Dialog.confirmCheckoutToDetachedHead(name, hasLocalChanges)
              .then(discardLocalChanges => {
                console.log(`SWITCHING TO DETACH HEAD ${name} `)
                vcs.onCheckoutToCommit(sha, discardLocalChanges)
              })
              .catch(noop)
          } else {
            Dialog.confirmBranchSwitch(name, hasLocalChanges)
              .then(discardLocalChanges => {
                console.log(`!!SWITCHING TO BRANCH ${branch.name} `)
                vcs.onBranchCheckout(branch.name, discardLocalChanges)
              })
              .catch(noop)
          }
        },
        enabled: !pendingOperation
      },
      {
        label: 'Merge...',
        click: () => {
          Dialog.confirmBranchMerge()
            .then(async commitOnSuccess => {
              console.log(`MERGING INTO CURRENT BRANCH ${commitOnSuccess}`)
              await vcs.merge(sha, commitOnSuccess)

              if (vcs.isMerging && vcs.hasConflicts) {
                Dialog.confirmMergeConflicts()
                  .then(noop)
                  .catch(noop)
              }
            })
            .catch(noop)
        },
        enabled: headCommit !== sha && !pendingOperation
      },
      {
        label: 'Rebase...',
        click: () => {
          Dialog.confirmBranchRebase(name)
            .then(() => {
              console.log('REBASING CURRENT CHANGES TO ', name)
            })
            .catch(noop)
        },
        enabled: headCommit !== sha && !pendingOperation
      },
      {
        type: 'separator'
      },
      {
        label: 'Tag...',
        click: () => {
          let tagName = ''

          workspace
            .showInputUnique({
              items: tags.map(({ name }) => ({ label: name })),
              placeHolder: 'Tag name',
              validateInput: input => /^[a-zA-Z0-9\-_.]+$/.test(input)
            })
            .then(name => {
              if (!name) return Promise.reject()

              tagName = name

              return workspace.showInputBox({
                placeHolder: 'Tag message',
                validateInput: input => !!input.trim()
              })
            })
            .then(tagMessage => {
              if (!tagMessage) return Promise.reject()

              console.log(`CREATING TAG ${tagName} ON COMMIT ${sha}`)
              vcs.createTag(sha, tagName, tagMessage)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      },
      {
        label: 'Branch...',
        click: () => {
          workspace
            .showInputUnique({
              items: heads.map(({ name }) => ({ label: name })),
              placeHolder: 'New branch',
              validateInput: input => /^[a-zA-Z0-9\-_.]+$/.test(input)
            })
            .then(name => {
              if (name) {
                console.log(`CREATING BRANCH ${name} ON COMMIT ${sha}`)
                vcs.createBranch(name)
              }
            })
            .catch(noop)
        },
        enabled: sha === headCommit && !pendingOperation
      },
      {
        type: 'separator'
      },
      {
        label: 'Soft Reset Branch...',
        click: () => {
          Dialog.confirmSoftBranchPointerReset('master')
            .then(() => {
              console.log(`SOFT BRANCH RESETTING...`)
              vcs.softResetCommit(sha)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      },
      {
        label: 'Mixed Reset Branch...',
        click: () => {
          Dialog.confirmMixedBranchPointerReset('master')
            .then(() => {
              console.log(`MIXED BRANCH RESETTING...`)
              vcs.mixedResetCommit(sha)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      },
      {
        label: 'Hard Reset Branch...',
        click: () => {
          Dialog.confirmHardBranchPointerReset('master')
            .then(() => {
              console.log(`HARD BRANCH RESETTING...`)
              vcs.hardResetCommit(sha)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      },
      {
        type: 'separator'
      },
      {
        label: 'Reverse commit...',
        click: () => {
          Dialog.confirmBackout()
            .then(() => {
              console.log(`BACKOUTING COMMIT...`)
              vcs.revertCommit(sha)
            })
            .catch(noop)
        },
        enabled: !pendingOperation
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy SHA-1 to Clipboard',
        click: () => {
          remote.clipboard.writeText(sha)
        }
      }
    ]
  })
}
