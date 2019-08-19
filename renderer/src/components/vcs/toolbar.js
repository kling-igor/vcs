import React, { memo, useRef, useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import { CommitIcon } from './icons'

const ButtonStyle = styled.div`
  display: block;
`

const compose = (...fns) => fns.reduceRight((prevFn, nextFn) => (...args) => nextFn(prevFn(...args)), value => value)

const withHover = Component =>
  memo(({ enabled = true, onClick, ...rest }) => {
    const [hovering, setHovering] = useState(false)

    const handleMouseOver = () => {
      // console.log('handleMouseOver')
      if (!enabled) return
      setHovering(true)
    }

    const handleMouseOut = () => {
      // console.log('handleMouseOut')
      if (!enabled) return
      setHovering(false)
    }

    const props = {
      hovering,
      ...rest
    }

    const clickHandler = useMemo(() => enabled && onClick && onClick(), [enabled])

    return (
      <Component
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        hovering={hovering}
        onClick={clickHandler}
        {...props}
      />
    )
  })

const withFillSvg = Svg => ({ active, hovering, color = '#ff00ff', hoverColor = '#ff0000', ...rest }) => {
  const activeValue = typeof active === 'function' ? active() : active
  const fill = activeValue || hovering ? hoverColor : color
  return <Svg fill={fill} {...rest} />
}

const Component = compose(
  withHover,
  withFillSvg
)

const FilledIcon = withFillSvg(CommitIcon)

const HoveringButton = withHover(props => {
  const { hovering } = props
  console.log('hovering:', hovering)
  return (
    <ButtonStyle>
      <FilledIcon active hovering={hovering} />
    </ButtonStyle>
  )
})

// const IconButton = Component(props => {
//   return (
//     <ButtonStyle>
//       <ComitIcon />
//     </ButtonStyle>
//   )
// })

const RootStyle = styled.div`
  height: 48px;
  width: 100%;
  background-color: pink;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const Toolbar = () => {
  return (
    <RootStyle>
      <HoveringButton />
    </RootStyle>
  )
}

export default Toolbar
