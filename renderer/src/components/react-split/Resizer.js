import React, { Component } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  background: #000;
  opacity: 0.2;
  z-index: 1;
  box-sizing: border-box;
  background-clip: padding-box;

  :hover {
    opacity: 0.5;
    transition: all 2s ease;
  }
`

const HorizontalWrapper = styled(Wrapper)`
  height: 10px;
  margin: -5px 0;
  border-top: 5px solid rgba(255, 255, 255, 0);
  border-bottom: 5px solid rgba(255, 255, 255, 0);
  cursor: row-resize;
  width: 100%;

  .disabled {
    cursor: not-allowed;
  }
  .disabled:hover {
    border-color: transparent;
  }
`

const VerticalWrapper = styled(Wrapper)`
  width: 10px;
  margin: 0 -5px;
  border-left: 5px solid rgba(255, 255, 255, 0);
  border-right: 5px solid rgba(255, 255, 255, 0);
  cursor: col-resize;

  .disabled {
    cursor: not-allowed;
  }
  .disabled:hover {
    border-color: transparent;
  }
`
export default class Resizer extends Component {
  render() {
    const {
      index,
      split = 'vertical',
      onClick = () => {},
      onDoubleClick = () => {},
      onMouseDown = () => {},
      onTouchEnd = () => {},
      onTouchStart = () => {}
    } = this.props

    const props = {
      ref: _ => {
        this.resizer = _
      },
      onMouseDown: event => onMouseDown(event, index),
      onTouchStart: event => {
        event.preventDefault()
        onTouchStart(event, index)
      },
      onTouchEnd: event => {
        event.preventDefault()
        onTouchEnd(event, index)
      },
      onClick: event => {
        if (onClick) {
          event.preventDefault()
          onClick(event, index)
        }
      },
      onDoubleClick: event => {
        if (onDoubleClick) {
          event.preventDefault()
          onDoubleClick(event, index)
        }
      }
    }

    return split === 'vertical' ? <VerticalWrapper {...props} /> : <HorizontalWrapper {...props} />
  }
}
