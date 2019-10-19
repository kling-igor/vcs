import React, { Component } from 'react'
import styled, { ThemeProvider } from 'styled-components'

import GlobalStyle from './styles'

import { resolve, join } from 'path'

import { observer } from 'mobx-react'

import SplitPane, { Pane } from './components/react-split'

import theme from './themes/ui/dark'
// import theme from './src/themes/ui/light'

import { Project } from './project'
import { ApplicationDelegate } from './application-delegate'
import { Workspace } from './workspace'
import { VCS } from './vcs'

import { Dock } from './components/dock'

import { VCSView } from './components/vcs'
import ChangesFileList from './components/vcs/changedfiles-list'
import CommitInfo from './components/vcs/commit-info'
import ChangedFiles from './components/vcs/changed-files'
import StagedFiles from './components/vcs/staged-files'

import BranchesList from './components/vcs/branches-list.js'
import TagsList from './components/vcs/tags-list.js'
import RemotesList from './components/vcs/remotes-list.js'

import * as Dialog from './dialogs'

import {
  onBranchContextMenu,
  onTagContextMenu,
  onGitLogContextMenu,
  onChangedFileContextMenu,
  onStagedFileContextMenu,
  onRemoteContextMenu,
  onVcsContextMenu
} from './components/vcs/context-menu'

import { onGitLogSettingsMenu } from './components/vcs/header-menu'

import { onStagedFilesHeaderMenu, onChangedFilesHeaderMenu, onRemotesHeaderMenu } from './components/vcs/header-menu'

const applicationDelegate = new ApplicationDelegate()
const project = new Project({ applicationDelegate })
const workspace = new Workspace({ project, applicationDelegate })
const vcs = new VCS({ workspace, project, applicationDelegate })

// находится в workspace!!!
const dock = new Dock()

// потом нужно все пути сделать через vision.

// ДОЛЖНО БЫТЬ В package
import { CloneProjectPane } from './components/vcs/stub'

const noop = () => {}

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
      pageTitle: 'git',
      pageIcon: './assets/ui/git/git.svg'
    })

    // ТАКЖЕ ЭТО ДЕЛАТЬ В ОТВЕТ НА ЗАКРЫТИЕ ПРОЕКТА
    dock.removePanes('vcs')
    dock.addPane('vcs', {
      component: <CloneProjectPane workspace={workspace} project={project} vcs={vcs} Dialog={Dialog} />
    })

    // ТАКЖЕ НУЖНО БУДЕТ УДАЛЯТЬ КОРНЕВОЙ ВИДЖЕТ КОТОРЫЙ СОДЕРЖИТ ПРЕДСТАВЛЕНИЕ VCS

    const replacePanes = mode => {
      dock.removePanes('vcs')

      const refreshButton = {
        icon: './assets/ui/refresh.svg',
        onClick: async () => {
          if (vcs.isProcessingGitLog) return

          await vcs.getLog()
          await vcs.status()
        },
        tooltip: 'Refresh'
      }

      const etcButton = {
        icon: './assets/ui/ellipsis.svg',
        onClick: onVcsContextMenu({ vcs, workspace, Dialog }),
        tooltip: ''
      }

      if (mode === 'commit') {
        dock.setPageButtons('vcs', [
          {
            icon: './assets/ui/git/git-log.svg',
            onClick: vcs.logMode,
            tooltip: 'Log'
          },
          refreshButton,
          etcButton
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
            onClick: async () => {
              let { name, email } = vcs

              if (!name || !email) {
                try {
                  const useForAllRepositories = await Dialog.confirmEnterUserDetails()

                  name = await workspace.showInputBox({
                    placeHolder: 'User name e.g. John Dow',
                    validateInput: input => /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/.test(input)
                  })

                  if (!name) return

                  email = await workspace.showInputBox({
                    placeHolder: 'Email e.g. jd@example.com',
                    validateInput: input => /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/.test(input)
                  })

                  if (!email) return

                  await vcs.storeUserDetails(name, email, useForAllRepositories)
                } catch (e) {
                  console.log('STORE USER DETAILS ERROR:', e)
                  return
                }
              }

              vcs.commitMode()
            },
            tooltip: 'Commit'
          },
          refreshButton,
          etcButton
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
              onClick: () => {
                console.log('HAS NO IMPLEMENTATION YET')
              },
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
              onClick: () => {
                console.log('HAS NO IMPLEMENTATION YET')
              },
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

    vcs.on('mode:changed', replacePanes)

    // set initial panes
    // ЭТО ДЕЛАТЬ В ОТВЕТ НА СОБЫТИЕ ОТКРЫТИЯ ПРОЕКТА
    replacePanes(vcs.mode)

    const PROJECT_PATH = '/Users/kling/Altarix/testrepo' //resolve(__dirname, '../test-repo')

    await vcs.open(PROJECT_PATH)
    await project.open({ projectPath: PROJECT_PATH })

    vcs.on('operation:begin', operation => {
      dock.setPageProgress('vcs', true)
    })

    vcs.on('operation:finish', operation => {
      dock.setPageProgress('vcs', false)
    })

    await vcs.getLog()

    dock.showPage('vcs')
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
                  onGitLogSettingsMenu={onGitLogSettingsMenu({ vcs, workspace, Dialog })}
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
