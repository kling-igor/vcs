import React, { memo } from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import moment from 'moment'
import { Scrollbars } from 'react-custom-scrollbars'
import MD5 from 'crypto-js/md5'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
  display: block;
`

const GravatarStyle = styled.img`
  display: inline-block;
  height: 40px;
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  min-height: 40px;
  max-height: 40px;
  line-height: 40px;
  border-radius: 50%;
  margin: 8px;
  user-select: none;
  pointer-events: none;
`

const TableStyle = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-left: 8px;
`

const LeftColumnStyle = styled.td`
  opacity: 0.8;
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

const RefStyle = styled(TextStyle)`
  :hover {
    text-decoration: underline;
    cursor: pointer;
  }
`

const CommitInfo = observer(({ onCommitContextMenu, storage: { commitInfo, onCommitSelect } }) => {
  if (!commitInfo) return null

  const {
    commit,
    author: { name, email },
    date,
    message,
    parents,
    labels
  } = commitInfo

  const hash = MD5(email).toString()

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
          <GravatarStyle
            src={`https://www.gravatar.com/avatar/${hash}?s=100&d=identicon`}
            draggable="false"
            width={40}
            height={40}
          />
          <span>{message}</span>
        </HorizontalLayoutStyle>

        <TableStyle>
          <tbody>
            <tr>
              <LeftColumnStyle>Commit:</LeftColumnStyle>
              <RightColumnStyle className="bp3-monospace-text">
                <TextStyle onContextMenu={() => onCommitContextMenu(commit)}>{commit.slice(0, 8)}</TextStyle>
              </RightColumnStyle>
            </tr>
            {parents.length > 0 && (
              <tr>
                <LeftColumnStyle>Parents:</LeftColumnStyle>
                <RightColumnStyle className="bp3-monospace-text">
                  {parents.map((sha, i) => (
                    <span key={sha}>
                      <RefStyle onClick={() => onCommitSelect(sha)}>{sha.slice(0, 8)}</RefStyle>
                      {i < parents.length - 1 && ', '}
                    </span>
                  ))}
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
            {labels.length > 0 && (
              <tr>
                <LeftColumnStyle>Labels:</LeftColumnStyle>
                <RightColumnStyle>
                  {labels.map((ref, i) => (
                    <span key={ref}>
                      <RefStyle>{ref.replace('refs/heads/', '')}</RefStyle>
                      {i < labels.length - 1 && ', '}
                    </span>
                  ))}
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
