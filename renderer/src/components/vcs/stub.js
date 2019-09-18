import React, { Component } from 'react'
import styled, { withTheme } from 'styled-components'
import { Button, Intent } from '@blueprintjs/core'

const TextStyle = styled.p`
  color: '#c3c3c3';
  user-select: none;
  pointer-events: none;
`

const ContainerStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-left: 8px;
  margin-right: 8px;
  margin-top: 16px;
`
const GIT_ADDR_REGEX = /((git|ssh|file|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?/

export const CloneProjectPane = withTheme(({ workspace, vcs, Dialog }) => {
  const handler = async operation => {
    let userName
    let password

    while (true) {
      try {
        await operation({ userName, password })
        return
      } catch (e) {
        console.log('OP ERROR:', e)

        if (e.message === 'Auth required') {
          console.log('AUTH REQUIRED!!!!!')

          try {
            await Dialog.confirmAuthRequired()
          } catch (e) {
            return
          }

          userName = await workspace.showInputBox({
            placeHolder: 'Username (email)',
            validateInput: () => true
          })

          if (!userName) return

          password = await workspace.showInputBox({
            placeHolder: 'Password',
            password: true,
            validateInput: () => true
          })

          if (!password) return
        } else if (e.message === 'Auth failed') {
          // Dialog

          return
        } else if (e.message === 'Connection error') {
          // Dialog
          return
        } else {
          console.log('BREAKING CYCLE!!!!')
          return
        }
      }
    }
  }

  return (
    <ContainerStyle>
      <TextStyle className="bp3-ui-text bp3-text-small bp3-text-muted">You have not yet opened a folder</TextStyle>
      <Button
        small
        intent={Intent.PRIMARY}
        onClick={async () => {
          // target directory
          const projectFolder = await workspace.showOpenFolderMenu()
          if (!projectFolder) return

          // repo url
          const remoteUrl = await workspace.showInputBox({
            placeHolder: 'Repository URL',
            validateInput: input => GIT_ADDR_REGEX.test(input)
          })

          if (!remoteUrl) return

          // possible credentials

          await handler(async ({ userName, password } = {}) => {
            await vcs.clone(remoteUrl, projectFolder, userName, password)
            await workspace.openProject(projectFolder)
          })
        }}
        style={{ borderRadius: '0px', width: '100%' }}
      >
        Clone
      </Button>
    </ContainerStyle>
  )
})
