import React, { memo, useCallback, useMemo } from 'react'
import styled from 'styled-components'

const colors = {
  M: {
    color: 'white',
    backgroundColor: '#1B80B2'
  },

  A: {
    color: 'white',
    backgroundColor: '#3c8746'
  },

  D: {
    color: 'white',
    backgroundColor: '#9E121D'
  },

  R: {
    color: 'white',
    backgroundColor: '#CC6633'
  },

  C: {
    color: 'white',
    backgroundColor: 'red'
  },

  U: {
    color: 'white',
    backgroundColor: '#6C6C6C'
  }
}

const BadgeStyle = styled.div`
  color: ${({ color }) => color};
  background-color: ${({ backgroundColor }) => backgroundColor};
  width: 1.3em;
  min-width: 1.3em;
  max-width: 1.3em;
  height: 1.3em;
  text-align: center;
  vertical-align: middle;
  border-radius: 40%;
  font-size: 11px;
  /* font-weight: 700; */
`

export default memo(({ value }) => {
  const color = (colors[value] && colors[value].color) || 'white'
  const backgroundColor = (colors[value] && colors[value].backgroundColor) || 'blue'

  return (
    <BadgeStyle color={color} backgroundColor={backgroundColor}>
      {value}
    </BadgeStyle>
  )
})
