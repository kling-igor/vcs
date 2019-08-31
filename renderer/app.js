import React, { Component } from 'react'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'

import { resolve, join } from 'path'

import { observer } from 'mobx-react'

import SplitPane, { Pane } from './src/components/react-split'

// import theme from './src/themes/ui/dark'
import theme from './src/themes/ui/light'

import { Project } from './project'
import { ApplicationDelegate } from './application-delegate'
import { Workspace } from './workspace'
import { VCS } from './vcs'

const workspace = new Workspace()

const applicationDelegate = new ApplicationDelegate()

const project = new Project({ applicationDelegate })

import { Dock } from './src/components/dock'
const dock = new Dock()

import VCSView from './src/components/vcs'
import ChangesFileList from './src/components/vcs/changedfiles-list'
import CommitInfo from './src/components/vcs/commit-info'
import ChangedFiles from './src/components/vcs/changed-files'
import StagedFiles from './src/components/vcs/staged-files'

import BranchesList from './src/components/vcs/branches-list.js'
import TagsList from './src/components/vcs/tags-list.js'
import RemotesList from './src/components/vcs/remotes-list.js'

import * as Dialog from './dialogs'

const noop = () => {}

const vcs = new VCS({ workspace, project, applicationDelegate })

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "Roboto";
    src: url("./assets/Roboto-Regular.ttf");
  }

  @font-face {
    font-family: "Roboto";
    src: url("./assets/Roboto-Bold.ttf");
    font-weight: bold;
  }

  html {
    height: 100%;
    margin: 0;
  }

  body {
    padding: 0;
    margin: 0;
    font-family: Roboto, sans-serif;
    overflow: hidden;
    height: 100%;
    overflow: hidden !important;
    background-color: ${({
      theme: {
        editor: { background }
      }
    }) => background};
  }

  #app {
    min-height: 100%;
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }

  .List {
    width: 100%;
  }

  .ReactVirtualized__List:focus{
    outline: none;
  }

  .quickOpenInput {
    margin: 4px;
  }

  .menu-item {
    font-size: 13px;
    /* font-weight: 500; */
    line-height: 1em;
  }

  .bp3-control.vision {
    margin-bottom: 4px;
  }

  ul.bp3-menu::-webkit-scrollbar {
    width: 10px;
  }
  /* Track */
  ul.bp3-menu::-webkit-scrollbar-track {
    background: ${({ theme }) => 'darkgray'};
  }
  /* Handle */
  ul.bp3-menu::-webkit-scrollbar-thumb {
    background: ${({ theme }) => '#888'};
  }
  /* Handle on hover */
  ul.bp3-menu::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => '#555'};
  }

  .popover {
    background-color: transparent;/*#ebf1f5*/
  }

  .bp3-popover-content {
    position: relative;
    top: 4px;
  }

  .bp3-button-text {
    user-select: none;
  }

  .bp3-button-icon {
    user-select: none;
  }

  .bp3-dialog {
    border-radius: 2px;
    width: auto;
    height: auto;
    top: 0;
    margin: 0;
    padding: 0;
    /* margin-top: 24px; */
  }

  .bp3-dialog-body {
    margin: 0;
  }

  .dialog-input {
    width: 100%;
  }

  div > .bp3-menu {
    max-height: 300px;
    overflow-y: auto;
    min-width: 500px;
    max-width: 500px;
    margin-left: -4;
  }

  .bp3-dialog-container {
    align-items: flex-start;
    justify-content: center;
  }

  /*иначе погруженные в tooltip формы скукоживаются*/
  span.bp3-popover-target {
    display: block;
  }

  .bp3-input {
    width: calc(100% - 8px);
    padding-right: 0px;
  }

  .bp3-input-group {
    padding-right: 8px;
  }
`

const RootStyle = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`

@observer
export default class App extends Component {
  state = {
    verticalLayout: ['20000', '20000']
  }

  onStagedFileContextMenu = path => {
    workspace.showContextMenu({
      items: [
        {
          label: `Unstage from index`,
          click: () => {
            Dialog.confirmUnstageFile()
              .then(() => {
                console.log('UNSTAGING ', path)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: `Copy Path to Clipboard`,
          click: () => {
            console.log('COPYING TO CLIPBOARD:', path)
          }
        }
      ]
    })
  }

  onChangedFileContextMenu = path => {
    workspace.showContextMenu({
      items: [
        {
          label: `Add to index`,
          click: () => {
            Dialog.confirmStageFile()
              .then(() => {
                console.log('STAGING ', path)
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
          }
        }
      ]
    })
  }

  onBranchContextMenu = sha => {
    const { name } = vcs.heads.find(item => item.sha === sha)

    const remotesSubmenu = vcs.remotes.map(item => ({
      label: item.name,
      click: () => {
        console.log('PUSH BRANCH TO:', item.url)
      }
    }))

    workspace.showContextMenu({
      items: [
        {
          label: `Checkout ${name}`,
          click: () => {
            Dialog.confirmBranchSwitch(name)
              .then(discardLocalChanges => {
                console.log(`SWITCHING TO BRANCH ${name} `)
                vcs.onBranchCheckout(name, discardLocalChanges)
              })
              .catch(noop)
          }
        },
        {
          label: `Merge ${name}`,
          click: () => {
            Dialog.confirmBranchMerge()
              .then(commitImmediatley => {
                console.log(`MERGING INTO CURRENT BRANCH AND COMMITING ${commitImmediatley}`)
              })
              .catch(noop)
          }
        },
        {
          label: `Rebase ${name}`,
          click: () => {
            Dialog.confirmBranchRebase(name)
              .then(() => {
                console.log('REBASING CURRENT CHANGES TO ', name)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: `Push to`,
          submenu: remotesSubmenu
        },
        {
          type: 'separator'
        },
        {
          label: `Rename...`,
          click: () => {
            workspace
              .showInputUnique({
                items: [
                  {
                    label: 'master'
                  },
                  {
                    label: 'add'
                  }
                ],
                placeHolder: 'New branch name',
                validateInput: input => /^[a-zA-Z0-9\-_]+$/.test(input)
              })
              .then(value => {
                if (value) {
                  console.log(`RENAMING BRANCH ${name} TO ${value}`)
                }
              })
              .catch(noop)
          }
        },
        {
          label: `Delete ${name}`,
          click: () => {
            Dialog.confirmBranchDelete(name)
              .then(deleteRemoteBranch => {
                console.log(`DELETING BRANCH ${name} AND DELETING REMOTE ${deleteRemoteBranch}`)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Copy Branch Name to Clipboard',
          click: () => {}
        }
      ]
    })
  }

  onTagContextMenu = sha => {
    const { currentCommit, heads, tags } = vcs

    const branch = heads.find(item => item.sha === sha)
    const tag = tags.find(item => item.sha === sha)

    const remotesSubmenu = vcs.remotes.map(item => ({
      label: item.name,
      click: () => {
        console.log('PUSH TAG TO:', item.url)
      }
    }))

    workspace.showContextMenu({
      items: [
        {
          label: `Checkout ${tag.name}`,
          click: () => {
            if (branch) {
              Dialog.confirmBranchSwitch(branch.name)
                .then(discardLocalChanges => {
                  console.log(`!!SWITCHING TO BRANCH ${branch.name} `)
                  vcs.onBranchCheckout(branch.name, discardLocalChanges)
                })
                .catch(noop)
            } else {
              Dialog.confirmCheckoutToDetachedHead(tag.name)
                .then(discardLocalChanges => {
                  console.log(`SWITCHING TO DETACH HEAD ${tag.name} `)
                  vcs.onCheckoutToCommit(tag.sha, discardLocalChanges)
                })
                .catch(noop)
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: `Push to`,
          submenu: remotesSubmenu
        },
        {
          label: `Delete ${tag.name}`,
          click: () => {
            Dialog.confirmTagDelete(name)
              .then(removeFromRemote => {
                console.log(`REMOVING TAG ${name} AND FROM REMOTE: ${removeFromRemote}`)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Copy Tag Name to Clipboard',
          click: () => {}
        }
      ]
    })
  }

  onRemoteContextMenu = name => {
    console.log('ON REMOTE CONTEXT MENU:', name)
  }

  onGitLogContextMenu = sha => {
    if (!sha) return

    const { currentCommit, heads, tags } = vcs

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
              Dialog.confirmCheckoutToDetachedHead(name)
                .then(discardLocalChanges => {
                  console.log(`SWITCHING TO DETACH HEAD ${name} `)
                  vcs.onCheckoutToCommit(sha, discardLocalChanges)
                })
                .catch(noop)
            } else {
              Dialog.confirmBranchSwitch(name)
                .then(discardLocalChanges => {
                  console.log(`!!SWITCHING TO BRANCH ${branch.name} `)
                  vcs.onBranchCheckout(branch.name, discardLocalChanges)
                })
                .catch(noop)
            }
          }
        },
        {
          label: 'Merge...',
          click: () => {
            Dialog.confirmBranchMerge()
              .then(commitImmediatley => {
                console.log(`MERGING INTO CURRENT BRANCH AND COMMITING ${commitImmediatley}`)
              })
              .catch(noop)
          }
        },
        {
          label: 'Rebase...',
          click: () => {
            Dialog.confirmBranchRebase(name)
              .then(() => {
                console.log('REBASING CURRENT CHANGES TO ', name)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Tag...',
          click: () => {
            workspace
              .showInputUnique({
                items: tags.map(({ name }) => ({ label: name })),
                placeHolder: 'Tag name',
                validateInput: input => /^[a-zA-Z0-9\-_.]+$/.test(input)
              })
              .then(value => {
                if (value) {
                  console.log(`CREATING TAG ${value} ON COMMIT ${sha}`)
                }
              })
              .catch(noop)
          }
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
              .then(value => {
                if (value) {
                  console.log(`CREATING BRANCH ${value} ON COMMIT ${sha}`)
                }
              })
              .catch(noop)
          }
        },
        {
          label: 'Reset branch to this commit...',
          submenu: [
            {
              label: 'Soft...',
              click: () => {
                Dialog.confirmSoftBranchPointerReset('master')
                  .then(() => {
                    console.log(`SOFT BRANCH RESETTING...`)
                  })
                  .catch(noop)
              }
            },
            {
              label: 'Mixed...',
              click: () => {
                Dialog.confirmMixedBranchPointerReset('master')
                  .then(() => {
                    console.log(`MIXED BRANCH RESETTING...`)
                  })
                  .catch(noop)
              }
            },
            {
              label: 'Hard...',
              click: () => {
                Dialog.confirmHardBranchPointerReset('master')
                  .then(() => {
                    console.log(`HARD BRANCH RESETTING...`)
                  })
                  .catch(noop)
              }
            }
          ]
        },
        {
          label: 'Reverse commit...',
          click: () => {
            Dialog.confirmBackout()
              .then(() => {
                console.log(`BACKOUTING COMMIT...`)
              })
              .catch(noop)
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Copy SHA-1 to Clipboard',
          click: () => {}
        }
      ]
    })
  }

  async componentDidMount() {
    dock.addPage('vcs', {
      pageTitle: 'GIT',
      panes: [],
      pageHeaderButtons: [
        {
          icon: './assets/ui/git/git-commit.svg',
          onClick: vcs.commitMode,
          tooltip: 'Commit'
        },
        {
          icon: './assets/ui/git/git-log.svg',
          onClick: vcs.logMode,
          tooltip: 'Log'
        },
        {
          icon: './assets/ui/refresh.svg',
          onClick: async () => {
            await vcs.getLog()
            await vcs.status()
          },
          tooltip: 'Refresh'
        }
      ]
    })

    const replacePanes = mode => {
      dock.removePanes('vcs')

      if (mode === 'commit') {
        dock.setPageButtons('vcs', [
          {
            icon: './assets/ui/git/git-log.svg',
            onClick: vcs.logMode,
            tooltip: 'Log'
          },
          {
            icon: './assets/ui/refresh.svg',
            onClick: async () => {
              await vcs.getLog()
              await vcs.status()
            },
            tooltip: 'Refresh'
          }
        ])

        dock.addPane('vcs', {
          title: 'STAGED',
          component: <StagedFiles storage={vcs} onContextMenu={this.onStagedFileContextMenu} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              onClick: vcs.showStagedFilesMenu,
              tooltip: ''
            }
          ]
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          component: <ChangedFiles storage={vcs} onContextMenu={this.onChangedFileContextMenu} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              onClick: vcs.showChangedFilesMenu,
              tooltip: ''
            }
          ]
        })
      } else if (mode === 'log') {
        dock.setPageButtons('vcs', [
          {
            icon: './assets/ui/git/git-commit.svg',
            onClick: vcs.commitMode,
            tooltip: 'Commit'
          },
          {
            icon: './assets/ui/refresh.svg',
            onClick: async () => {
              await vcs.getLog()
              await vcs.status()
            },
            tooltip: 'Refresh'
          }
        ])

        dock.addPane('vcs', {
          title: 'COMMIT INFO',
          component: <CommitInfo storage={vcs} />
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          component: <ChangesFileList storage={vcs} />
        })

        dock.addPane('vcs', {
          title: 'BRANCHES',
          component: <BranchesList storage={vcs} onContextMenu={this.onBranchContextMenu} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              tooltip: ''
            }
          ]
        })

        dock.addPane('vcs', {
          title: 'TAGS',
          component: <TagsList storage={vcs} onContextMenu={this.onTagContextMenu} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              tooltip: ''
            }
          ]
        })

        dock.addPane('vcs', {
          title: 'REMOTES',
          component: <RemotesList storage={vcs} onContextMenu={this.onRemoteContextMenu} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              tooltip: ''
            }
          ]
        })
      }
    }

    vcs.setModeChangeHandler(replacePanes)

    // set initial panes
    replacePanes(vcs.mode)

    dock.showPage('vcs')

    await vcs.openRepo(resolve(__dirname, '../test-repo'))
    await project.open({ projectPath: resolve(__dirname, '../test-repo') })
    await vcs.getLog()
  }

  setVerticalLayout = layout => {
    this.setState({ verticalLayout: layout })
  }

  render() {
    const leftSize = +this.state.verticalLayout[0] / 100
    const rightSize = +this.state.verticalLayout[1] / 100

    const DockWidget = dock.widget

    return (
      <ThemeProvider theme={theme}>
        <>
          <GlobalStyle />
          <RootStyle>
            <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={this.setVerticalLayout}>
              <Pane size={leftSize} minSize="100px" maxSize="100%">
                <DockWidget />
              </Pane>
              <Pane size={rightSize} minSize="400px" maxSize="100%">
                <VCSView storage={vcs} workspace={workspace} onGitLogContextMenu={this.onGitLogContextMenu} />
              </Pane>
            </SplitPane>
          </RootStyle>
          {!!workspace.customModalView && workspace.customModalView}
        </>
      </ThemeProvider>
    )
  }
}
