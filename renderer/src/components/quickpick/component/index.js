import React from 'react'
import styled from 'styled-components'
import { MenuItem, Dialog, Classes, Intent } from '@blueprintjs/core'
import { Suggest } from '@blueprintjs/select'

const SuggestContainerStyle = styled.div`
  width: 500px;
  height: ${({ hint }) => (hint ? '64px' : '32px')};
`

const ItemIconStyle = styled.img`
  margin-right: 4px;
`

const LabelMenuItemStyle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`

const DetailMenuItemStyle = styled.span`
  font-size: 12px;
  opacity: 0.7;
`

function escapeRegExpChars(text) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
}

function highlightText(text = '', query) {
  let lastIndex = 0
  const words = query
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(escapeRegExpChars)
  if (words.length === 0) {
    return [text]
  }
  const regexp = new RegExp(words.join('|'), 'gi')
  const tokens = []
  while (true) {
    const match = regexp.exec(text)
    if (!match) {
      break
    }
    const length = match[0].length
    const before = text.slice(lastIndex, regexp.lastIndex - length)
    if (before.length > 0) {
      tokens.push(before)
    }
    lastIndex = regexp.lastIndex
    tokens.push(
      <strong key={lastIndex} style={{}}>
        {match[0]}
      </strong>
    )
  }
  const rest = text.slice(lastIndex)
  if (rest.length > 0) {
    tokens.push(rest)
  }
  return tokens
}

const filterItems = (query, items) => {
  const filteredItems = items.filter(({ label, detail }) => {
    const text = `${label}/${detail || ''}`
    return text.toLowerCase().indexOf(query.toLowerCase()) >= 0
  })

  return filteredItems
}

export class QuickSelect extends React.Component {
  state = {
    intent: Intent.PRIMARY,
    isOpen: true
  }

  renderMenuItem = ({ icon, label, detail }, query) => {
    return (
      <LabelMenuItemStyle>
        {!!icon && <ItemIconStyle height="16" width="16" src={icon} />}
        <span>
          {highlightText(label, query)}
          {!!detail && (
            <>
              <span> </span>
              <DetailMenuItemStyle>{highlightText(detail, query)}</DetailMenuItemStyle>
            </>
          )}
        </span>
      </LabelMenuItemStyle>
    )
  }

  renderItem = (item, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
      return null
    }

    const { label, detail } = item

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={`${label}/${detail || ''}`}
        onClick={handleClick}
        text={this.renderMenuItem(item, query)}
        textClassName="menu-item"
      />
    )
  }

  onQueryChange = query => {
    // тут можно, например, вызывать колбек для перехода на строку редактора

    if (this.props.shouldCreateNewItems && this.props.inputValidator) {
      this.setState({ isInvalid: !this.props.inputValidator(query) })
    }

    if (this.props.onInputChange) {
      this.props.onInputChange(query)
    }
  }

  handleValueChange = value => {
    if (this.state.isInvalid) return

    const selectExistent = this.props.items.includes(value)

    if (selectExistent) {
      if (this.props.shouldCreateNewItems) {
        this.setState({ isInvalid: true })
        return
      }
    }

    this.setState({ isOpen: false })
    this.props.onSelect(value.label)
  }

  renderInputValue = ({ label }) => {
    return label
  }

  renderCreateOption = (query, active, handleClick) => (
    <MenuItem icon="add" text={`Create "${query}"`} active={active} onClick={handleClick} shouldDismissPopover={true} />
  )

  dialogClose = () => {
    this.setState({ isOpen: false })
    this.props.onSelect()
  }

  render() {
    const {
      items,
      placeHolder,
      hint,
      password,
      shouldCreateNewItems = false,
      shouldRenderCreateNewItem = false,
      noResultsText = null,
      onClosed,
      darkTheme
    } = this.props

    const noResults = noResultsText ? <MenuItem disabled={true} text={noResultsText} /> : null
    const maybeCreateNewItemRenderer =
      shouldRenderCreateNewItem && !this.state.isInvalid ? this.renderCreateOption : null
    const maybeCreateNewItemFromQuery = shouldCreateNewItems ? query => ({ label: query }) : null

    return (
      <Dialog
        autoFocus={true}
        className={darkTheme ? 'bp3-dark' : ''}
        isOpen={this.state.isOpen}
        transitionDuration={0}
        // backdropClassName="backdrop"
        inputProps={{ small: true, fill: true }}
        onClosed={onClosed}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        onClose={this.dialogClose}
      >
        <SuggestContainerStyle
          ref={ref => {
            this.divRef = ref
          }}
          className={Classes.DIALOG_BODY}
          hint={hint}
        >
          <Suggest
            createNewItemFromQuery={maybeCreateNewItemFromQuery}
            createNewItemRenderer={maybeCreateNewItemRenderer}
            items={items}
            itemRenderer={this.renderItem}
            itemListPredicate={filterItems}
            onQueryChange={this.onQueryChange}
            closeOnSelect={true}
            openOnKeyDown={false}
            resetOnClose={false}
            resetOnQuery={true}
            resetOnSelect={false}
            inputValueRenderer={this.renderInputValue}
            noResults={noResults}
            onItemSelect={this.handleValueChange}
            usePortal={false}
            popoverProps={{
              minimal: true,
              // portalContainer: this.divRef,
              targetClassName: 'dialog-input',
              popoverClassName: 'popover'
            }}
            inputProps={{
              inputRef: el => {
                !!el && el.focus()
              },
              small: true,
              fill: true,
              intent: this.state.isInvalid ? Intent.DANGER : Intent.PRIMARY,
              className: 'quickOpenInput',
              placeholder: placeHolder,
              type: password ? 'password' : 'text'
            }}
          />
        </SuggestContainerStyle>
      </Dialog>
    )
  }
}
