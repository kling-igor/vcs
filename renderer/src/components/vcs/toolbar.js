const { ipcRenderer, remote } = window.require('electron')
const { callMain, answerMain } = require('../../../ipc').default(ipcRenderer)

import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import styled from 'styled-components'

import { CommitIcon, MergeIcon, AddBranchIcon, RepoIcon, CompareIcon, PullIcon, PushIcon } from './icons'

const ButtonStyle = styled.div`
  display: block;
  margin-left: 8px;
  margin-right: 8px;
`

const WrapperStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`

const TitleStyle = styled.span`
  font-size: 11px;
  font-family: Arial, Helvetica, sans-serif;
  text-align: center;
  color: ${({ color }) => color};
`

// const compose = (...fns) => fns.reduceRight((prevFn, nextFn) => (...args) => nextFn(prevFn(...args)), value => value)

const IconButton = (Svg, title) =>
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
      <WrapperStyle onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={clickHandler}>
        <ButtonStyle>
          <Svg fill={fill} />
        </ButtonStyle>
        <TitleStyle color={fill}>{title}</TitleStyle>
      </WrapperStyle>
    )
  })

const CommitButton = IconButton(CommitIcon, 'Commit')
const PullButton = IconButton(PullIcon, 'Pull')
const PushButton = IconButton(PushIcon, 'Push')

const AddBranchButton = IconButton(AddBranchIcon, 'Branch')
const MergeButton = IconButton(MergeIcon, 'Merge')
const RepoButton = IconButton(RepoIcon, 'Repo')
const CompareButton = IconButton(CompareIcon, 'Compare')

const RootStyle = styled.div`
  height: 48px;
  width: 100%;
  background-color: pink;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LeftGroupStyle = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const Toolbar = () => {
  return (
    <RootStyle>
      <LeftGroupStyle>
        <CommitButton
          onClick={async () => {
            console.log('COMMIT')
            await callMain('commit:create', 'commit message...')
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

        <AddBranchButton
          onClick={() => {
            console.log('ADD BRANCH')
          }}
        />
        <MergeButton
          onClick={() => {
            console.log('ANOTHER MERGE')
          }}
        />

        <CompareButton
          onClick={() => {
            console.log('COMPARE')
          }}
        />
      </LeftGroupStyle>

      <RepoButton
        onClick={() => {
          console.log('REPO')
        }}
      />
    </RootStyle>
  )
}

export default Toolbar
