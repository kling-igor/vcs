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

import { Dock } from './src/components/dock'

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
  onStagedFileContextMenu,
  onRemoteContextMenu,
  onVcsContextMenu
} from './src/components/vcs/context-menu'

import {
  onStagedFilesHeaderMenu,
  onChangedFilesHeaderMenu,
  onRemotesHeaderMenu
} from './src/components/vcs/header-menu'

const workspace = new Workspace()
const applicationDelegate = new ApplicationDelegate()
const project = new Project({ applicationDelegate })
const vcs = new VCS({ workspace, project, applicationDelegate })
const dock = new Dock()

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

  async componentDidMount() {
    dock.addPage('vcs', {
      pageTitle: 'GIT',
      pageIcon: './assets/ui/git/git.svg'
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
          },
          {
            icon: './assets/ui/ellipsis.svg',
            onClick: onVcsContextMenu({ vcs, workspace, Dialog }),
            tooltip: ''
          }
        ])

        dock.addPane('vcs', {
          title: 'STAGED',
          elapsed: true,
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
          elapsed: true,
          component: (
            <ChangedFiles storage={vcs} onContextMenu={onChangedFileContextMenu({ vcs, workspace, project, Dialog })} />
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
          },
          {
            icon: './assets/ui/ellipsis.svg',
            onClick: onVcsContextMenu({ vcs, workspace, Dialog }),
            tooltip: ''
          }
        ])

        dock.addPane('vcs', {
          title: 'COMMIT INFO',
          elapsed: true,
          component: <CommitInfo storage={vcs} />
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          elapsed: true,
          component: <ChangesFileList storage={vcs} />
        })

        dock.addPane('vcs', {
          title: 'BRANCHES',
          elapsed: false,
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
          elapsed: false,
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
          elapsed: false,
          component: <RemotesList storage={vcs} onContextMenu={onRemoteContextMenu({ vcs, workspace, Dialog })} />,
          paneHeaderButtons: [
            {
              icon: './assets/ui/ellipsis.svg',
              onClick: onRemotesHeaderMenu({ vcs, workspace }),
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
