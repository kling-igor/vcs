import React, { useState, useCallback } from 'react'
import styled, { withTheme } from 'styled-components'
import { Scrollbars } from 'react-custom-scrollbars'
import { observer } from 'mobx-react'
import LinearProgress from '@material-ui/core/LinearProgress'
import { withStyles } from '@material-ui/core/styles'
import SplitPane, { Pane } from '../react-split'

const svgThemedName = (theme, path) => {
  if (theme.type === 'dark') {
    return path.substring(0, path.lastIndexOf('.')) + '-dark' + path.substring(path.lastIndexOf('.'))
  }

  return path
}

const UnselectableStyle = styled.div`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
  pointer-events: none;
`

/**
 * Контейнер дока
 */
const DockStyle = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%; /*!!header ? 'calc(100% - 35px)' : '100%',*/
  background-color: ${({
    theme: {
      sideBar: { background }
    }
  }) => (background ? background : '#f0f')};
  overflow: auto;
  border-right-color: ${({
    theme: {
      sideBar: { border, background }
    }
  }) => (border ? border : background)};
  border-right-style: ${({
    theme: {
      sideBar: { border }
    }
  }) => (border ? 'solid' : 'none')};
  border-right-width: ${({
    theme: {
      sideBar: { border }
    }
  }) => (border ? '1px' : '0px')};
`

/**
 * Заголовок страницы дока
 */

const DockHeaderWrapperStyle = styled.div`
  position: relative;
  overflow: hidden;
`

const DockHeaderStyle = styled.div`
  overflow: hidden;

  position: relative;
  top: 0px;
  left: 0px;
  height: 35px;
  min-height: 35px;
  width: 100%;

  padding-left: 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: ${({
    theme: {
      sideBar: { background }
    }
  }) => (background ? background : '#f00')};
  font-size: 11px;
  font-family: 'Open Sans', sans-serif;
  letter-spacing: 0px;
  color: ${({
    theme: {
      sideBarTitle: { foreground }
    }
  }) => foreground || '#ffff00'};
`

const DockPageTitleStyle = styled.div`
  margin-left: 5px;
`

/**
 * Заголовок секции страницы дока
 */
const DockPaneHeaderStyle = styled.div`
  overflow: hidden;

  position: relative;
  top: 0px;
  left: 0px;
  height: 22px;
  min-height: 22px;
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: ${({
    theme: {
      sideBarSectionHeader: { background }
    }
  }) => background || '#ff00ff'};
  font-size: 11px;
  font-weight: bold;
  font-family: 'Open Sans', sans-serif;
  letter-spacing: 0px;
  color: ${({
    theme: {
      sideBarSectionHeader: { foreground }
    }
  }) => foreground || '#ffff00'};
`

/**
 * Стрелка раскрытия секции страницы дока
 */
const DockHeaderArrowStyle = styled.img`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
  pointer-events: none;

  margin-right: 3px;
  margin-left: 3px;
`

const DocksHeaderButtonWrapperStyle = styled.div`
  margin-left: 4px;
  margin-right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const DockHeaderButtonStyle = styled.img`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
  opacity: ${({ disabled }) => (disabled ? '0.7' : '1')};
`

/**
 * Секция страницы дока
 */
const DockPaneStyle = styled.div`
  display: flex;
  flex-direction: column;
  height: ${({ elapsed }) => (elapsed ? '100%' : '22px')};
  width: 100%;
  overflow: ${({ elapsed }) => (elapsed ? 'auto' : 'hidden')};
`

const LeftAlignedBlock = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const RightAlignedBlock = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

const ContainerWithScrollbarsStyle = styled(Scrollbars)`
  width: 100%;
  height: 100%;
  background: ${({
    theme: {
      sideBar: { background }
    }
  }) => background};
  overflow: hidden;
`

const ScrollBarThumbStyle = styled.div`
  background-color: #424341;
  border-radius: 4px;
`

const PaneStyle = styled.div`
  /* height: ${({ offset = 0 }) => `calc(100% - ${offset}px)`}; */
  width: 100%;
  overflow: hidden;
`

const Button = ({ src, disabled, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const [pressing, setPressing] = useState(false)

  const handleMouseEnter = () => {
    setHovered(true)
  }
  const handleMouseLeave = () => {
    setHovered(false)
    setPressing(false)
  }
  const handleMousePress = () => {
    setPressing(true)
  }
  const handleMouseRelease = () => {
    setPressing(false)
    setHovered(false)
  }

  const size = hovered && pressing ? 20 : 16

  return (
    <DocksHeaderButtonWrapperStyle>
      <DockHeaderButtonStyle
        key={src}
        draggable={false}
        src={src}
        width={size}
        height={size}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMousePress}
        onMouseUp={handleMouseRelease}
      />
    </DocksHeaderButtonWrapperStyle>
  )
}

const ColorLinearProgress = withStyles({
  root: {
    height: 2,
    width: '100%',
    backgroundColor: 'transparent'
  },
  bar: {
    backgroundColor: '#6fa0f6'
  }
})(LinearProgress)

const ProgressRootStyle = styled.div`
  position: absolute;
  left: 0px;
  top: 33px;
  width: 100%;
  z-index: 9999;
`

const LinearProgressIndicator = ({ inProgress }) => {
  if (inProgress) {
    return (
      <ProgressRootStyle>
        <ColorLinearProgress />
      </ProgressRootStyle>
    )
  }

  return null
}

const DockPane = ({ headerButtons = [], theme, elapsed, onHeaderClick, title, children }) => {
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = () => setHovered(true)
  const handleMouseLeave = () => setHovered(false)

  const arrowSrc = svgThemedName(
    theme,
    elapsed ? './assets/ui/expando_expanded.svg' : './assets/ui/expando_collapsed.svg'
  )

  return (
    <DockPaneStyle className={theme.type === 'dark' ? 'bp3-dark' : ''} elapsed={elapsed}>
      <DockPaneHeaderStyle onClick={onHeaderClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <LeftAlignedBlock>
          <DockHeaderArrowStyle draggable={false} src={arrowSrc} width={16} height={16} />
          <UnselectableStyle>{title}</UnselectableStyle>
        </LeftAlignedBlock>
        {hovered && elapsed && (
          <RightAlignedBlock>
            {headerButtons.map(({ icon, onClick, tooltip, disabled }) => {
              const onClickHandler = event => {
                event.preventDefault()
                event.stopPropagation()
                if (!disabled) {
                  onClick()
                }
              }
              return <Button key={icon} src={svgThemedName(theme, icon)} disabled={disabled} onClick={onClickHandler} />
            })}
          </RightAlignedBlock>
        )}
      </DockPaneHeaderStyle>
      {children}
    </DockPaneStyle>
  )
}

const withScrollBars = WrappedComponent =>
  withTheme(props => (
    <ContainerWithScrollbarsStyle
      autoHide={true}
      autoHideTimeout={1000}
      autoHideDuration={200}
      thumbMinSize={30}
      renderThumbHorizontal={({ style, ...props }) => <ScrollBarThumbStyle />}
      renderThumbVertical={({ style, ...props }) => <ScrollBarThumbStyle />}
    >
      {WrappedComponent}
    </ContainerWithScrollbarsStyle>
  ))

const renderDockPane = (
  title,
  component,
  elapsed,
  offset = 0,
  handlePaneHeaderClick,
  theme,
  paneHeaderButtons = []
) => {
  const Component = typeof component === 'function' ? component() : component

  const ComponentWithScrollBars = withScrollBars(Component)

  if (!title) {
    return (
      <PaneStyle key={'no_key'} offset={offset}>
        <ComponentWithScrollBars />
      </PaneStyle>
    )
  }

  if (elapsed === false) {
    return (
      <DockPane
        key={title}
        title={title}
        elapsed={false}
        onHeaderClick={handlePaneHeaderClick}
        theme={theme}
        headerButtons={paneHeaderButtons}
      />
    )
  }

  return (
    <PaneStyle key={title} offset={offset}>
      <DockPane
        title={title}
        elapsed={true}
        onHeaderClick={handlePaneHeaderClick}
        theme={theme}
        headerButtons={paneHeaderButtons}
      >
        <ComponentWithScrollBars />
      </DockPane>
    </PaneStyle>
  )
}

const renderPageHeader = ({ theme, pageTitle, pageIcon, pageHeaderButtons = [], inProgress }) => {
  if (!pageTitle) return null
  return (
    <DockHeaderWrapperStyle>
      <DockHeaderStyle>
        <LeftAlignedBlock>
          {!!pageIcon && <DockHeaderButtonStyle src={pageIcon} width={16} height={16}></DockHeaderButtonStyle>}
          <UnselectableStyle>
            <DockPageTitleStyle>{pageTitle}</DockPageTitleStyle>
          </UnselectableStyle>
        </LeftAlignedBlock>
        <RightAlignedBlock>
          {pageHeaderButtons.map(({ icon, onClick, tooltip, disabled }) => {
            const onClickHandler = event => {
              event.preventDefault()
              event.stopPropagation()
              if (!disabled) {
                onClick()
              }
            }

            return <Button key={icon} src={svgThemedName(theme, icon)} disabled={disabled} onClick={onClickHandler} />
          })}
        </RightAlignedBlock>
      </DockHeaderStyle>
      <LinearProgressIndicator inProgress={inProgress} />
    </DockHeaderWrapperStyle>
  )
}

export const DockView = withTheme(
  observer(({ pages, currentPage, onPaneHeaderClick, onResizeEnd, paneSizes, theme }) => {
    const handleResizeEnd = data => {
      onResizeEnd(currentPage, data.map(item => parseFloat(item) / 100))
    }

    if (currentPage == null) return null

    const page = pages[currentPage]
    if (!page) {
      console.error(`Dock page ${currentPage} not found`)
      return null
    }

    const { pageTitle, panes, pageHeaderButtons = [] } = page

    const panesCount = panes.length

    if (panesCount < 1) return null

    const makePaneHeaderClickHandler = index => () => {
      onPaneHeaderClick(currentPage, index)
    }

    if (panesCount > 1) {
      // если меняется состав открытых\закрытых панелей, то сохраненные значения могут быть нерелевантны
      // как минимум стоит их тоже занулить если открывается/закрывается какая-то панель!!!

      const elapsedPanesCount = panes.reduce((accum, { elapsed }) => (elapsed ? accum + 1 : accum), 0)

      if (elapsedPanesCount >= 2) {
        let sizes = paneSizes[currentPage].slice()

        // если размеры не определены
        if (sizes.length === 0) {
          let firstFoundElapsedPaneIndex = -1

          // формируем дефолтные
          sizes = panes.map(({ elapsed }, i) => {
            if (elapsed && firstFoundElapsedPaneIndex === -1) {
              firstFoundElapsedPaneIndex = i
            }

            if (elapsed) return '144px'

            return '22px'
          })

          // для первой открытой панели выставляем 100%
          if (firstFoundElapsedPaneIndex !== -1) {
            sizes[firstFoundElapsedPaneIndex] = '100%'
          }
        }

        return (
          <DockStyle>
            {renderPageHeader({ theme, ...page })}
            <SplitPane split="horizontal" allowResize={true} resizerSize={1} onResizeEnd={handleResizeEnd}>
              {panes.map(({ title, component, elapsed, paneHeaderButtons = [] }, i) => {
                if (elapsed === false) {
                  // return renderDockPane(title, component, elapsed, 0, makePaneHeaderClickHandler(i))
                  return (
                    <Pane key={title} initialSize="22px" minSize="22px" maxSize="22px">
                      {renderDockPane(
                        title,
                        component,
                        elapsed,
                        !!pageTitle ? 35 : 0,
                        makePaneHeaderClickHandler(i),
                        theme,
                        paneHeaderButtons
                      )}
                    </Pane>
                  )
                }

                // const initialSize = sizes[i] == null ? '144px' : sizes[i]

                return (
                  <Pane key={title} initialSize={sizes[i]} minSize="144px" maxSize="100%">
                    {renderDockPane(
                      title,
                      component,
                      elapsed,
                      !!pageTitle ? 35 : 0,
                      makePaneHeaderClickHandler(i),
                      theme,
                      paneHeaderButtons
                    )}
                  </Pane>
                )
              })}
            </SplitPane>
          </DockStyle>
        )
      } else {
        return (
          <DockStyle>
            {renderPageHeader({ theme, ...page })}
            {panes.map(({ title, component, elapsed, paneHeaderButtons = [] }, i) =>
              renderDockPane(
                title,
                component,
                elapsed,
                !!pageTitle ? 35 : 0,
                makePaneHeaderClickHandler(i),
                theme,
                paneHeaderButtons
              )
            )}
          </DockStyle>
        )
      }
    }

    if (panesCount === 1) {
      const [{ title, component, elapsed, paneHeaderButtons = [] }] = panes

      return (
        <DockStyle>
          {renderPageHeader({ theme, ...page })}
          {renderDockPane(
            title,
            component,
            elapsed,
            !!pageTitle ? 35 : 0,
            makePaneHeaderClickHandler(0),
            theme,
            paneHeaderButtons
          )}
        </DockStyle>
      )
    }

    return renderPageHeader({ theme, ...page })
  })
)
