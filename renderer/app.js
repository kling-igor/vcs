const { remote } = window.require('electron')

import React, { Component } from 'react'
import styled, { ThemeProvider } from 'styled-components'

import GlobalStyle from './styles'

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

import {
  onBranchContextMenu,
  onTagContextMenu,
  onGitLogContextMenu,
  onChangedFileContextMenu,
  onStagedFileContextMenu
} from './src/components/vcs/context-menu'

import { onStagedFilesHeaderMenu, onChangedFilesHeaderMenu } from './src/components/vcs/header-menu'

const noop = () => {}

const vcs = new VCS({ workspace, project, applicationDelegate })

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

  onRemoteContextMenu = name => {
    console.log('ON REMOTE CONTEXT MENU:', name)
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
          component: <StagedFiles storage={vcs} onContextMenu={onStagedFileContextMenu({ vcs, workspace, Dialog })} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              onClick: onStagedFilesHeaderMenu({ vcs, workspace }),
              tooltip: ''
            }
          ]
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          component: (
            <ChangedFiles storage={vcs} onContextMenu={onChangedFileContextMenu({ vcs, workspace, Dialog })} />
          ),
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              onClick: onChangedFilesHeaderMenu({ vcs, workspace }),
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
          component: <BranchesList storage={vcs} onContextMenu={onBranchContextMenu({ vcs, workspace, Dialog })} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              tooltip: ''
            }
          ]
        })

        dock.addPane('vcs', {
          title: 'TAGS',
          component: <TagsList storage={vcs} onContextMenu={onTagContextMenu({ vcs, workspace, Dialog })} />,
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
                <VCSView
                  storage={vcs}
                  workspace={workspace}
                  onGitLogContextMenu={onGitLogContextMenu({ vcs, workspace, Dialog })}
                />
              </Pane>
            </SplitPane>
          </RootStyle>
          {!!workspace.customModalView && workspace.customModalView}
        </>
      </ThemeProvider>
    )
  }
}
