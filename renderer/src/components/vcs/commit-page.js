import React, { Component, memo, useCallback, useState, useEffect } from 'react'
import SplitPane, { Pane } from '../react-split'
import styled from 'styled-components'
import { Button, TextArea } from '@blueprintjs/core'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

const CommitPage = memo(
  ({ layout: { primary = ['200', '50'], secondary = ['200', '200'] } = {}, onLayoutChange = () => {} }) => {
    const [mainLayout, setMainLayout] = useState(primary)
    const [secondaryLayout, setSecondaryLayout] = useState(secondary)

    useEffect(() => {
      const serialized = { primary: mainLayout }
      console.log('serialized:', serialized)
      onLayoutChange(serialized)
    }, [mainLayout])

    const upperSize = +mainLayout[0] / 100
    const lowerSize = +mainLayout[1] / 100

    const leftSize = +secondaryLayout[0] / 100
    const rightSize = +secondaryLayout[1] / 100

    return (
      <SplitPane split="horizontal" allowResize resizersSize={0} onResizeEnd={setMainLayout}>
        <Pane size={upperSize} minSize="50px" maxSize="100%">
          <SplitPane split="vertical" allowResize resizersSize={0} onResizeEnd={setSecondaryLayout}>
            <Pane size={leftSize} minSize="200px" maxSize="100%">
              <div style={{ height: '100%', backgroundColor: 'magenta' }}>FILES</div>
            </Pane>
            <Pane size={rightSize} minSize="400px" maxSize="100%">
              <div style={{ height: '100%', backgroundColor: 'yellow' }}>DIFF</div>
            </Pane>
          </SplitPane>
        </Pane>
        <Pane size={lowerSize} minSize="50px" maxSize="100%">
          <div style={{ height: '100%', width: '100%', backgroundColor: 'green', position: 'relative' }}>
            <TextArea
              style={{
                position: 'absolute',
                left: 8,
                right: 8,
                top: 32,
                bottom: 32,
                width: 'calc(100% - 16px)',
                height: 'calc(100% - 40px)'
              }}
              small={true}
              fill={true}
              growVertically={true}
              large={true}
              // intent={Intent.PRIMARY}
              // onChange={this.handleChange}
              value="Lorem Ipsum"
            />
            <div
              style={{
                // display: 'flex',
                // flexDirection: 'row',
                // justifyContent: 'flex-end',
                // alignContent: 'flex-end',
                position: 'absolute',
                bottom: 0,
                right: 0,
                margin: 8
              }}
            >
              <Button small style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button small intent="primary">
                Commit
              </Button>
            </div>
          </div>
        </Pane>
      </SplitPane>
    )
  }
)

export default CommitPage
