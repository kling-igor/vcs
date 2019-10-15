import React, { useState } from 'react'

import { QuickSelect } from './component'

const noop = () => {}

export const Input = ({
  placeHolder = '',
  validateInput = () => true,
  password = false,
  onInputChange = noop,
  onSelect = noop,
  darkTheme = false
}) => {
  return (
    <QuickSelect
      shouldCreateNewItems={true}
      shouldRenderCreateNewItem={false}
      inputValidator={validateInput}
      password={password}
      items={[]}
      darkTheme={darkTheme}
      onInputChange={onInputChange}
      onSelect={onSelect}
      placeHolder={placeHolder}
    />
  )
}

export const QuickPick = ({ items, placeHolder = '', noResultsText, onSelect = noop, darkTheme = false }) => {
  return (
    <QuickSelect
      items={items}
      noResultsText={noResultsText}
      darkTheme={darkTheme}
      onSelect={onSelect}
      placeHolder={placeHolder}
    />
  )
}

export const InputUnique = ({ items, placeHolder = '', validateInput, onSelect = noop, darkTheme = false }) => {
  return (
    <QuickSelect
      shouldCreateNewItems={true}
      inputValidator={validateInput}
      items={items}
      darkTheme={darkTheme}
      onSelect={onSelect}
      placeHolder={placeHolder}
    />
  )
}
