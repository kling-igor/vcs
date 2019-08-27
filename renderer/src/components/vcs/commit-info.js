import React, { memo } from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import moment from 'moment'
import { Scrollbars } from 'react-custom-scrollbars'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`

const IconStyle = styled.span`
  display: inline-block;
  height: 40px;
  width: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 40px;
  color: white;
  background-color: ${({ color }) => color};
  font-size: 1.25em;
  margin: 8px;
`

const TableStyle = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-left: 8px;
`

const LeftColumnStyle = styled.td`
  text-align: right;
  width: 50px;
  user-select: none;
`

const RightColumnStyle = styled.td`
  text-align: left;
`

const TextStyle = styled.span`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
`

const HorizontalLayoutStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
`

// background: ${({
//   theme: {
//     sideBar: { background }
//   }
// }) => background};
const ContainerWithScrollbarsStyle = styled(Scrollbars)`
  width: 100%;
  height: 100%;
`

const ScrollBarThumbStyle = styled.div`
  background-color: #424341;
  border-radius: 4px;
`

const CommitInfo = observer(({ storage: { commitInfo } }) => {
  if (!commitInfo) return null

  const {
    commit,
    author: { name, email },
    date,
    message,
    parents,
    labels
  } = commitInfo

  const parentsString = parents.length > 0 ? parents.join(', ') : null
  const labelsString = labels.length > 0 ? labels.join(', ').toUpperCase() : null

  const LETTERS = name
    .split(' ')
    .map(item => item.slice(0, 1))
    .slice(0, 2)

  return (
    <ContainerWithScrollbarsStyle
      autoHide={true}
      autoHideTimeout={1000}
      autoHideDuration={200}
      thumbMinSize={30}
      renderThumbHorizontal={({ style, ...props }) => <ScrollBarThumbStyle />}
      renderThumbVertical={({ style, ...props }) => <ScrollBarThumbStyle />}
    >
      <RootStyle className="bp3-ui-text bp3-text-small">
        <HorizontalLayoutStyle>
          <IconStyle color={'blue'}>{LETTERS}</IconStyle>
          <span>{message}</span>
        </HorizontalLayoutStyle>

        <TableStyle>
          <tbody>
            <tr>
              <LeftColumnStyle>Commit:</LeftColumnStyle>
              <RightColumnStyle className="bp3-monospace-text">
                <TextStyle>
                  {commit} {`[${commit.slice(0, 8)}]`}
                </TextStyle>
              </RightColumnStyle>
            </tr>
            {!!parentsString && (
              <tr>
                <LeftColumnStyle>Parents:</LeftColumnStyle>
                <RightColumnStyle className="bp3-monospace-text">
                  <TextStyle>{parentsString}</TextStyle>
                </RightColumnStyle>
              </tr>
            )}
            <tr>
              <LeftColumnStyle>Author:</LeftColumnStyle>
              <RightColumnStyle>
                <TextStyle>{`${name} <${email}>`}</TextStyle>
              </RightColumnStyle>
            </tr>
            <tr>
              <LeftColumnStyle>Date:</LeftColumnStyle>
              <RightColumnStyle>
                <TextStyle>{`${moment.unix(date).format('Do MMMM YYYY, H:mm:ss')}`}</TextStyle>
              </RightColumnStyle>
            </tr>
            {!!labelsString && (
              <tr>
                <LeftColumnStyle>Labels:</LeftColumnStyle>
                <RightColumnStyle>
                  <TextStyle>{labelsString}</TextStyle>
                </RightColumnStyle>
              </tr>
            )}
          </tbody>
        </TableStyle>
      </RootStyle>
    </ContainerWithScrollbarsStyle>
  )
})

export default CommitInfo
