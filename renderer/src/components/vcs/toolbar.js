import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import styled from 'styled-components'

import {
  CommitIcon,
  MergeIcon,
  ForkIcon,
  AnotherMergeIcon,
  AddBranchIcon,
  RepoIcon,
  CompareIcon,
  PullIcon,
  PushIcon
} from './icons'

const ButtonStyle = styled.div`
  display: block;
`

// const compose = (...fns) => fns.reduceRight((prevFn, nextFn) => (...args) => nextFn(prevFn(...args)), value => value)

const IconButton = Svg =>
  memo(({ active = false, enabled = true, color = 'gray', hoverColor = 'black', onClick = () => {} }) => {
    const [hovering, setHovering] = useState(false)

    const handleMouseOver = useCallback(() => {
      if (!enabled) return
      setHovering(true)
    }, [enabled])

    const handleMouseOut = useCallback(() => {
      if (!enabled) return
      setHovering(false)
    }, [enabled])

    const clickHandler = useCallback(() => enabled && onClick && onClick(), [enabled])

    const fill = active || hovering ? hoverColor : color

    return (
      <ButtonStyle onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={clickHandler}>
        <Svg fill={fill} />
      </ButtonStyle>
    )
  })

const CommitButton = IconButton(CommitIcon)
const MergeButton = IconButton(MergeIcon)
const ForkButton = IconButton(ForkIcon)

const AnotherMergeButton = IconButton(AnotherMergeIcon)
const AddBranchButton = IconButton(AddBranchIcon)
const RepoButton = IconButton(RepoIcon)
const CompareButton = IconButton(CompareIcon)

const PullButton = IconButton(PullIcon)
const PushButton = IconButton(PushIcon)

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
      <CommitButton
        onClick={() => {
          console.log('COMMIT')
        }}
      />
      <MergeButton
        onClick={() => {
          console.log('MERGE')
        }}
      />
      <ForkButton
        onClick={() => {
          console.log('FORK')
        }}
      />
      <AnotherMergeButton
        onClick={() => {
          console.log('ANOTHER MERGE')
        }}
      />
      <AddBranchButton
        onClick={() => {
          console.log('ADD BRANCH')
        }}
      />
      <RepoButton
        onClick={() => {
          console.log('REPO')
        }}
      />
      <CompareButton
        onClick={() => {
          console.log('COMPARE')
        }}
      />
      <PullButton
        onClick={() => {
          console.log('PULL')
        }}
      />
      <PushButton
        onClick={() => {
          console.log('PUSH')
        }}
      />
    </RootStyle>
  )
}

export default Toolbar
