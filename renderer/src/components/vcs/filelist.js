import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'

const ListItemContainerStyle = styled.li`
  padding: 0;
  padding-left: 4px;
  padding-right: 8px;
  margin: 0;
  list-style-type: none;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;

  cursor: pointer;
  user-select: none;
  :hover {
    background-color: blue;
    color: white;
  }
`

const ListItemLeftGroupStyle = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: baseline;
`

const ListItemFilenameStyle = styled.span`
  white-space: nowrap;
`

const ListItemPathStyle = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  margin-left: 1em;
  opacity: 0.8;
`

const ListStyle = styled.ul`
  font-size: 13px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.2em;
  white-space: nowrap;
  padding: 0;
  margin: 0px;
  margin-top: 0px;
`

const CaptionStyle = styled.div`
  padding: 0;
  margin: 0;
  padding-left: 4px;
`

const CaptionText = styled.span`
  user-select: none;
`

const ListRootStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const colors = {
  M: {
    color: 'yellow',
    backgroundColor: 'darkgreen'
  },

  A: {
    color: 'white',
    backgroundColor: 'darkgreen'
  },

  D: {
    color: 'white',
    backgroundColor: 'black'
  },

  R: {
    color: 'white',
    backgroundColor: 'navyblue'
  },

  C: {
    color: 'white',
    backgroundColor: 'orange'
  },

  U: {
    color: 'yellow',
    backgroundColor: 'brown'
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
  border-radius: 50%;
`

const StatusBadge = memo(({ value }) => {
  const letter = useMemo(() => {
    let letter = value.replace('I', '')
    if (letter.length > 1 && letter.includes('D')) {
      letter = value.replace('D', '')
    }
    return letter
  }, [value])

  const color = (colors[letter] && colors[letter].color) || 'white'
  const backgroundColor = (colors[letter] && colors[letter].backgroundColor) || 'blue'

  return (
    <BadgeStyle color={color} backgroundColor={backgroundColor}>
      {letter}
    </BadgeStyle>
  )
})

const Checkbox = memo(({ indeterminate, ...props }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return <input ref={ref} type="checkbox" {...props} />
})

// https://www.git-scm.com/docs/git-status#_short_format

const FileList = ({ files, caption, onSelectionChanged }) => {
  const [checkboxes, setCheckboxes] = useState({})
  // const [allChecked, setAllChecked] = useState(false)
  // const [indeterminate, setIndeterminate] = useState(false)

  useEffect(() => {
    // первоначальное заполнение checkboxes (все false)
    setCheckboxes(old =>
      // TODO: может придти обновленный состав files и нужно в новом наборе восстановить состояния чекбоксов, который были до этого !!!
      files.reduce((obj, { filename, path }) => {
        obj[`${path}/${filename}`] = !!old[`${path}/${filename}`]
        return obj
      }, {})
    )
  }, [files])

  const handleInputChange = useCallback(
    event => {
      const key = event.currentTarget.dataset.path
      setCheckboxes(old => {
        return { ...old, [key]: !old[key] }
      })
    },
    [checkboxes]
  )

  useEffect(() => {
    const entries = Object.entries(checkboxes)

    // let isAllChecked = entries.length > 0
    // let isAllUnchecked = true
    const selected = entries.reduce((acc, [key, selected]) => {
      if (selected) {
        // isAllUnchecked = false
        return [...acc, key]
      } else {
        // isAllChecked = false
        return acc
      }
    }, [])

    // setAllChecked(isAllChecked)

    // const isPartiallyChecked = !isAllChecked && !isAllUnchecked
    // setIndeterminate(isPartiallyChecked)

    onSelectionChanged(selected)
  }, [checkboxes])

  // const handleCaptionInputChange = useCallback(event => {
  //   const { checked } = event.target

  //   setCheckboxes(prev =>
  //     Object.keys(prev).reduce((obj, key) => {
  //       obj[key] = checked
  //       return obj
  //     }, {})
  //   )
  // })

  return (
    <ListRootStyle>
      {/* <CaptionStyle>
        <Checkbox indeterminate={indeterminate} checked={allChecked || false} onChange={handleCaptionInputChange} />
        <CaptionText>{caption}</CaptionText>
      </CaptionStyle> */}
      <Scrollbars
        style={{ width: '100%', height: '100%' }}
        thumbMinSize={30}
        autoHide
        autoHideTimeout={1000}
        autoHideDuration={200}
      >
        <ListStyle>
          {files.map(({ filename, path, status }) => {
            const decoratedPath = path === '.' ? '' : path
            return (
              <ListItemContainerStyle key={`${path}/${filename}`}>
                <ListItemLeftGroupStyle>
                  <input
                    type="checkbox"
                    checked={checkboxes[`${path}/${filename}`] || false}
                    onChange={handleInputChange}
                    data-path={`${path}/${filename}`}
                  />
                  <ListItemFilenameStyle>{filename}</ListItemFilenameStyle>
                  <ListItemPathStyle>{decoratedPath}</ListItemPathStyle>
                </ListItemLeftGroupStyle>
                <StatusBadge value={status} />
              </ListItemContainerStyle>
            )
          })}
        </ListStyle>
      </Scrollbars>
    </ListRootStyle>
  )
}

export default FileList
