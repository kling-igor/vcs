import React, { memo, useMemo, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import {
  Classes,
  Button,
  Intent,
  InputGroup,
  Icon,
  TextArea,
  Popover,
  PopoverInteractionKind,
  PopoverPosition,
  RadioGroup,
  Radio
} from '@blueprintjs/core'

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
  cursor: pointer;
`

const NameEmailStyle = styled.span`
  margin: 0px;
  user-select: none;
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
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
  align-items: center;
  width: 100%;
  height: 100%;
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

const UserDetails = ({ hash, name, email }) => {
  const [variant, setVariant] = useState('default')

  const [alterName, setAlterName] = useState('')
  const [alterEmail, setAlterEmail] = useState('')

  const onVariantChange = useCallback(event => {
    setVariant(event.currentTarget.value)
  })

  const onNameChanged = useCallback(event => {
    setAlterName(event.target.value)
  })

  const onEmailChanged = useCallback(event => {
    setAlterEmail(event.target.value)
  })

  return (
    <div style={{ width: 400, height: 230, display: 'flex', flexDirection: 'column', padding: 16 }}>
      <RadioGroup onChange={onVariantChange} selectedValue={variant}>
        <Radio label="Use default author" value="default">
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <GravatarStyle
              src={`https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`}
              draggable="false"
              width={50}
              height={50}
            />
            <NameEmailStyle>{`${name} <${email}>`}</NameEmailStyle>
          </div>
        </Radio>
        <Radio label="Use alternative author" value="alternative" />
      </RadioGroup>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          marginLeft: 28
        }}
      >
        <InputGroup
          onChange={onNameChanged}
          placeholder="Username"
          value={alterName}
          small
          fill
          style={{ marginBottom: 8 }}
        />
        <InputGroup
          onChange={onEmailChanged}
          placeholder="Email"
          value={alterEmail}
          small
          fill
          style={{ marginBottom: 8 }}
        />
      </div>
      <Button
        className={Classes.POPOVER_DISMISS}
        text="OK"
        intent="primary"
        onClick={() => {
          console.log('VARIANT:', variant)
          if (variant === 'alternative') {
            console.log('ALTER NAME:', alterName)
            console.log('ALTER EMAIL:', alterEmail)
          }
        }}
        small
        style={{ alignSelf: 'flex-end', width: 100 }}
      />
    </div>
  )
}

export default memo(
  ({ name, email, onChange, text, previousCommits, onShowPreviousCommits, onCommit, onCancelCommit }) => {
    const [commitable, setCommitable] = useState(false)
    const hash = useMemo(() => MD5(email).toString(), [email])

    useEffect(() => {
      setCommitable((text && text.length > 0 && text.trim()) || false)
    }, [text])

    return (
      <HorizontalConatiner>
        <Popover
          popoverClassName="popover"
          interactionKind={PopoverInteractionKind.CLICK}
          content={<UserDetails hash={hash} name={name} email={email} />}
          hasBackdrop={false}
          inheritDarkTheme
          position={PopoverPosition.top}
          modifiers={{ arrow: { enabled: true } /*, offset: { offset: '0, 10' } */ }}
        >
          <GravatarStyle
            src={`https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`}
            draggable="false"
            width={50}
            height={50}
          />
        </Popover>
        <VerticalContainerStyle>
          <UpperHorizontalConatiner>
            <NameEmailStyle>{`${name} <${email}>`}</NameEmailStyle>
            <Button
              small
              minimal
              disabled={previousCommits.length === 0}
              icon={IconNames.HISTORY}
              onClick={onShowPreviousCommits}
              intent={Intent.PRIMARY}
              // disabled={!hasHistoryChanges}
              style={historyButtonStyle}
            />
          </UpperHorizontalConatiner>
          <CommitAreaStyle onChange={onChange} value={text} />
          <ButtonsContainerStyle>
            <Button small style={cancelButtonStyle} onClick={onCancelCommit}>
              Cancel
            </Button>
            <Button small intent="primary" style={commitButtonStyle} disabled={!commitable} onClick={onCommit}>
              Commit
            </Button>
          </ButtonsContainerStyle>
        </VerticalContainerStyle>
      </HorizontalConatiner>
    )
  }
)
