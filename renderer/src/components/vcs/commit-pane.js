import React, { memo, useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Button, Intent, Icon, TextArea } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import MD5 from 'crypto-js/md5'

const ButtonsContainerStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-content: flex-end;
  align-self: flex-end;
  margin: 8px;
  margin-top: 4px;
`

const GravatarStyle = styled.img`
  border-radius: 50%;
  padding: 8px;
  user-select: none;
  pointer-events: none;
`

const NameEmailStyle = styled.span`
  margin: 8px;
  margin-bottom: 0px;
  margin-left: 0px;
  user-select: none;
`

const VerticalContainerStyle = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
`

const HorizontalConatiner = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  background-color: cyan;
`

const UpperHorizontalConatiner = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  /* background-color: greenyellow; */
`

const CommitAreaStyle = styled(TextArea)`
  font-size: 14px;
  margin-right: 8px;
  margin-left: 0px;
  margin-bottom: 4px;
  margin-top: 0px;
  overflow: auto;
  max-width: calc(100% - 8px);
  min-width: calc(100% - 8px);
  max-height: calc(100% - 74px);
  min-height: calc(100% - 74px);
  &:focus {
    outline: none;
  }
  &::-webkit-scrollbar {
    width: 10px;
  }
  /* Track */
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => 'darkgray'};
  }
  /* Handle */
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => '#888'};
  }
  /* Handle on hover */
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => '#555'};
  }
`

const commitButtonStyle = { paddingLeft: 16, paddingRight: 16 }
const cancelButtonStyle = { ...commitButtonStyle, marginRight: 8 }
const historyButtonStyle = { width: '30px', height: '30px', marginRight: '8px', outline: 'none' }

export default memo(({ name, email, onChange, text }) => {
  const [commitable, setCommitable] = useState(false)
  const hash = useMemo(() => MD5(email).toString(), [email])

  useEffect(() => {
    setCommitable((text && text.length > 0 && text.trim()) || false)
  }, [text])

  return (
    <HorizontalConatiner>
      <GravatarStyle
        src={`https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`}
        draggable="false"
        width={50}
        height={50}
      />
      <VerticalContainerStyle>
        <UpperHorizontalConatiner>
          <NameEmailStyle>{`${name} <${email}>`}</NameEmailStyle>
          <Button
            small
            minimal
            icon={IconNames.HISTORY}
            onClick={() => {
              console.log('HISTORY MESSAGES')
            }}
            intent={Intent.PRIMARY}
            // disabled={!hasHistoryChanges}
            style={historyButtonStyle}
          />
        </UpperHorizontalConatiner>
        <CommitAreaStyle onChange={onChange} value={text} />
        <ButtonsContainerStyle>
          <Button small style={cancelButtonStyle}>
            Cancel
          </Button>
          <Button small intent="primary" style={commitButtonStyle} disabled={!commitable}>
            Commit
          </Button>
        </ButtonsContainerStyle>
      </VerticalContainerStyle>
    </HorizontalConatiner>
  )
})
