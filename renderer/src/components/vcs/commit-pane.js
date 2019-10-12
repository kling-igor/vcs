import React, { memo, useMemo, useState, useEffect, useCallback } from 'react'
import styled, { withTheme } from 'styled-components'
import MD5 from 'crypto-js/md5'
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

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
  z-index: 9999;
`

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
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: ${({ theme: { type } }) => (type === 'dark' ? '#ffffffaa' : '#000000aa')};
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

const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  background-color: ${({ theme: { type } }) => (type === 'dark' ? '#293742' : '#ebf1f5')};
`

const UpperHorizontalContainer = styled.div`
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

  color: ${({ theme: { type } }) => (type === 'dark' ? '#f5f8fa' : 'black')};
  background-color: ${({ theme: { type } }) => (type === 'dark' ? 'rgba(16, 22, 26, 0.3)' : 'white')};

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

const PopupStyle = styled.div`
  width: 400px;
  height: 230px;
  display: flex;
  flex-direction: column;
  padding: 16px;
`

const PopupUpperHorizontalContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const PopupInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-left: 28px;
`
const PopupInputStyle = styled(InputGroup)`
  margin-bottom: 8px;
`

const commitButtonStyle = { paddingLeft: 16, paddingRight: 16 }
const cancelButtonStyle = { ...commitButtonStyle, marginRight: 8 }
const historyButtonStyle = { width: '30px', height: '30px', marginRight: '8px', outline: 'none' }

const UserDetails = ({ name, email, alterName: _alterName, alterEmail: _alterEmail, onClose }) => {
  const [variant, setVariant] = useState(_alterName && _alterEmail ? 'alternative' : 'default')

  const [alterName, setAlterName] = useState(_alterName)
  const [alterEmail, setAlterEmail] = useState(_alterEmail)

  const onVariantChange = useCallback(event => {
    setVariant(event.currentTarget.value)
  })

  const onNameChanged = useCallback(event => {
    setAlterName(event.target.value)
  })

  const onEmailChanged = useCallback(event => {
    setAlterEmail(event.target.value)
  })

  const hash = useMemo(() => MD5(email).toString(), [email])

  return (
    <PopupStyle>
      <RadioGroup onChange={onVariantChange} selectedValue={variant}>
        <Radio label="Use default author" value="default">
          <PopupUpperHorizontalContainer>
            <GravatarStyle
              src={`https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`}
              draggable="false"
              width={50}
              height={50}
            />
            <NameEmailStyle>{`${name} <${email}>`}</NameEmailStyle>
          </PopupUpperHorizontalContainer>
        </Radio>
        <Radio label="Use alternative author" value="alternative" />
      </RadioGroup>
      <PopupInputContainer>
        <PopupInputStyle onChange={onNameChanged} placeholder="Username" value={alterName} small fill />
        <PopupInputStyle onChange={onEmailChanged} placeholder="Email" value={alterEmail} small fill />
      </PopupInputContainer>
      <Button
        className={Classes.POPOVER_DISMISS}
        text="OK"
        intent="primary"
        onClick={() => {
          if (variant === 'alternative') {
            onClose(variant, alterName, alterEmail)
          } else {
            onClose(variant)
          }
        }}
        small
        style={{ alignSelf: 'flex-end', width: 100 }}
      />
    </PopupStyle>
  )
}

export default memo(
  withTheme(
    ({
      theme,
      enabled,
      name,
      email,
      onChange,
      text,
      previousCommits,
      onShowPreviousCommits,
      onCommit,
      onCancelCommit,
      alterName,
      alterEmail,
      setAlterUserNameEmail
    }) => {
      const [committable, setCommittable] = useState(false)
      const hash = useMemo(() => MD5(alterEmail || email).toString(), [email, alterEmail])

      useEffect(() => {
        setCommittable((text && text.length > 0 && text.trim()) || false)
      }, [text])

      const onPopupClose = useCallback((variant, alterName, alterEmail) => {
        if (variant === 'alternative') {
          setAlterUserNameEmail(alterName, alterEmail)
        } else {
          setAlterUserNameEmail()
        }
      })

      const popoverClassName = useMemo(() => (theme.type === 'dark' ? 'popover bp3-dark' : 'popover'), [theme])

      const buttonContainerClassName = useMemo(() => (theme.type === 'dark' ? 'bp3-dark' : ''), [theme])

      return (
        <RootStyle>
          <HorizontalContainer>
            <Popover
              popoverClassName={popoverClassName}
              interactionKind={PopoverInteractionKind.CLICK}
              content={
                <UserDetails
                  hash={hash}
                  name={name}
                  email={email}
                  alterName={alterName}
                  alterEmail={alterEmail}
                  onClose={onPopupClose}
                />
              }
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
              <UpperHorizontalContainer>
                <NameEmailStyle>{`${alterName || name} <${alterEmail || email}>`}</NameEmailStyle>
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
              </UpperHorizontalContainer>
              <CommitAreaStyle onChange={onChange} value={text} disabled={!enabled} />
              <ButtonsContainerStyle className={buttonContainerClassName}>
                <Button small style={cancelButtonStyle} onClick={onCancelCommit} disabled={!enabled}>
                  Cancel
                </Button>
                <Button
                  small
                  intent="primary"
                  style={commitButtonStyle}
                  disabled={!committable}
                  onClick={onCommit}
                  disabled={!enabled}
                >
                  Commit
                </Button>
              </ButtonsContainerStyle>
            </VerticalContainerStyle>
          </HorizontalContainer>
        </RootStyle>
      )
    }
  )
)
