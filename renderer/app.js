import React, { Component } from 'react'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'

import { observer } from 'mobx-react'

import SplitPane, { Pane } from './src/components/react-split'

// import theme from './src/themes/ui/dark'
import theme from './src/themes/ui/light'

import Workspace from './workspace'
const workspace = new Workspace()

import { Dock } from './src/components/dock'
const dock = new Dock()

import VCSView from './src/components/vcs'
import ChangesFilelist from './src/components/vcs/changesfilelist'
import CommitInfo from './src/components/vcs/commit-info'
import ChangedFiles from './src/components/vcs/changed-files'
import StagedFiles from './src/components/vcs/staged-files'

import VCS from './vcs'
const storage = new VCS()

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

  async componentDidMount() {
    dock.addPage('vcs', {
      pageTitle: 'GIT',
      panes: [],
      pageHeaderButtons: [
        {
          icon: './assets/ui/git/git-commit.svg',
          onClick: storage.commitMode,
          tooltip: 'Commit'
        },
        {
          icon: './assets/ui/git/git-log.svg',
          onClick: storage.logMode,
          tooltip: 'Log'
        },
        {
          icon: './assets/ui/refresh.svg',
          onClick: () => {
            console.log('GIT STATUS')
          },
          tooltip: 'Refresh'
        }
      ]
    })

    const replacePanes = mode => {
      dock.removePane('vcs', 0)
      dock.removePane('vcs', 0)

      if (mode === 'commit') {
        dock.addPane('vcs', {
          title: 'STAGED',
          component: <StagedFiles storage={storage} />
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          component: <ChangedFiles storage={storage} />
        })
      } else if (mode === 'log') {
        dock.addPane('vcs', {
          title: 'COMMIT INFO',
          component: <CommitInfo storage={storage} />
        })

        dock.addPane('vcs', {
          title: 'CHANGES',
          component: <ChangesFilelist storage={storage} />
        })
      }
    }

    storage.setModeChangeHandler(replacePanes)

    // set initial panes
    replacePanes(storage.mode)

    dock.showPage('vcs')

    storage.openRepo('../test-repo').then(() => storage.getLog())
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
                <VCSView storage={storage} />
              </Pane>
            </SplitPane>
          </RootStyle>
        </>
      </ThemeProvider>
    )
  }
}
