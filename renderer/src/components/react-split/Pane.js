import React, { PureComponent } from 'react'
import { getUnit, convertSizeToCssValue } from './SplitPane'

function PaneStyle({ split = 'vertical', initialSize = '1', size, minSize = '0', maxSize = '100%', resizersSize }) {
  const value = size || initialSize
  const vertical = split === 'vertical'
  const styleProp = {
    minSize: vertical ? 'minWidth' : 'minHeight',
    maxSize: vertical ? 'maxWidth' : 'maxHeight',
    size: vertical ? 'width' : 'height'
  }

  let style = {
    display: 'flex',
    outline: 'none'
  }

  style[styleProp.minSize] = convertSizeToCssValue(minSize, resizersSize)
  style[styleProp.maxSize] = convertSizeToCssValue(maxSize, resizersSize)

  switch (getUnit(value)) {
    case 'ratio':
      style.flex = value
      break
    case '%':
    case 'px':
      style.flexGrow = 0
      style[styleProp.size] = convertSizeToCssValue(value, resizersSize)
      break
  }

  return style
}

class Pane extends PureComponent {
  setRef = element => {
    this.props.innerRef(this.props.index, element)
  }

  render() {
    const { children, className } = this.props
    return (
      <div className={className} style={PaneStyle(this.props)} ref={this.setRef}>
        {children}
      </div>
    )
  }
}

// Pane.propTypes = {
//   children: PropTypes.node,
//   innerRef: PropTypes.func,
//   index: PropTypes.number,
//   className: PropTypes.string,
//   initialSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   minSize: PropTypes.string,
//   maxSize: PropTypes.string,
// };

export default Pane
