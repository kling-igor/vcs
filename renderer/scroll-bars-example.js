import React, { Component } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'

const RootStyle = styled.div`
  width: 100%;
  height: 2000px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const ContainerWithScrollbarsStyle = styled(Scrollbars)`
  width: 100%;
  height: 100%;
`

const ScrollBarThumbStyle = styled.div`
  background-color: #424341;
  border-radius: 4px;
`

export default class App extends Component {
  render() {
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
          <div style={{ height: '100%', width: '100%', backgroundColor: 'green' }} />
        </RootStyle>
      </ContainerWithScrollbarsStyle>
    )
  }
}
