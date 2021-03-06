import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import ReactResizeDetector from 'react-resize-detector'

const GridBackgroundStyle = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  background-image: ${({ background }) =>
    background === 'transparent'
      ? `linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%),
    linear-gradient(45deg, #444 25%, #333 25%, #333 75%, #444 75%)`
      : ''};
  background-size: ${({ background }) => (background === 'transparent' ? '24px 24px' : '')};
  background-position: ${({ background }) => (background === 'transparent' ? '0 0, 12px 12px' : '')};
  background-color: ${({ background }) => (background === 'transparent' ? null : background)};
  display: flex;
  justify-content: center;
  align-items: center;
`

const ImageStyle = styled.img`
  opacity: ${({ loaded }) => (loaded ? '1' : '0')};
  transition: opacity 0.25s;
`

const ButtonStyle = styled.div`
  border-color: ${({ selected }) => (selected ? '#6fa0f6' : 'gray')};
  border-radius: 3px;
  border-width: 1px;
  border-style: solid;
  width: 24px;
  height: 24px;
  background-color: ${({ color }) => (color ? color : 'transparent')};
  margin: 8px;
`

const TransparentButtonStyle = styled(ButtonStyle)`
  background-image: linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%),
    linear-gradient(45deg, #444 25%, #333 25%, #333 75%, #444 75%);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
`

const ButtonsContainer = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  width: 100%;
  height: 56px;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-right: 16px;
`

export const ImageViewer = memo(({ src }) => {
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState('transparent')
  const imageRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [scale, setScale] = useState(1)
  const [componentWidth, setComponentWidth] = useState(0)
  const [componentHeight, setComponentHeight] = useState(0)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [background, setBackground] = useState('transparent')

  const onWheel = useCallback(e => {
    if (e.deltaY > 0 && scale > 0.05) {
      setScale(scale - 0.05)
    } else if (e.deltaY < 0 && scale < 1) {
      setScale(scale + 0.05)
    }
  })

  useEffect(() => {
    let wFactor = 1
    if (imageWidth > componentWidth) {
      wFactor = componentWidth / imageWidth
    }

    let hFactor = 1
    if (imageHeight > componentHeight) {
      hFactor = componentHeight / imageHeight
    }

    const factor = Math.min(wFactor, hFactor)

    setWidth(imageWidth * factor)
    setHeight(imageHeight * factor)
  }, [componentWidth, componentHeight, imageWidth, imageHeight])

  useEffect(() => {
    const storeImageSize = function() {
      setImageWidth(this.naturalWidth)
      setImageHeight(this.naturalHeight)
      setLoaded(true)
    }

    if (imageRef.current) {
      imageRef.current.addEventListener('load', storeImageSize)
    }

    return () => {
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', storeImageSize)
      }
    }
  }, [])

  const onResize = useCallback((w, h) => {
    setComponentWidth(w)
    setComponentHeight(h)
  })

  const onBlack = useCallback(() => {
    setBackground('#000')
    setSelected('black')
  }, [])

  const onWhite = useCallback(() => {
    setBackground('#fff')
    setSelected('white')
  }, [])

  const onTransparent = useCallback(() => {
    setBackground('transparent')
    setSelected('transparent')
  }, [])

  return (
    <ReactResizeDetector handleWidth handleHeight onResize={onResize}>
      <GridBackgroundStyle onWheel={onWheel} background={background}>
        <ImageStyle
          ref={imageRef}
          width={width * scale}
          height={height * scale}
          src={`${src}?hash=${Date.now()}`}
          loaded={loaded}
        />
        <ButtonsContainer>
          <TransparentButtonStyle onClick={onTransparent} selected={selected === 'transparent'} />
          <ButtonStyle color="black" onClick={onBlack} selected={selected === 'black'} />
          <ButtonStyle color="white" onClick={onWhite} selected={selected === 'white'} />
        </ButtonsContainer>
      </GridBackgroundStyle>
    </ReactResizeDetector>
  )
})
