// https://code.visualstudio.com/api/references/theme-color
export default {
  type: 'dark',
  contrastBorder: '#000000', //An extra border around elements to separate them from others for greater contrast.
  contrastActiveBorder: '#000000', //An extra border around active elements to separate them from others for greater contrast.

  focusBorder: '#000000', //Overall border color for focused elements. This color is only used if not overridden by a component.
  foreground: '#ffffff', //Overall foreground color. This color is only used if not overridden by a component.

  selection: {
    background: '#0000ff' //Background color of text selections in the workbench (for input fields or text areas, does not apply to selections within the editor and the terminal).
  },
  descriptionForeground: '#ff00ff', //Foreground color for description text providing additional information, for example for a label.
  errorForeground: '#ffffff', //Overall foreground color for error messages (this color is only used if not overridden by a component).

  sideBar: {
    background: '#252526', //Side Bar background color.
    foreground: '#cccccc', //Side Bar foreground color. The Side Bar is the container for views like Explorer and Search.
    border: '#252526' //Side Bar border color on the side separating the editor.
  },
  sideBarTitle: {
    foreground: '#bababa' //Side Bar title foreground color.
  },
  sideBarSectionHeader: {
    background: '#383839', // Side Bar section header background color.
    foreground: '#cacaca' // Side Bar section header foreground color.
    // border: '#00ff00' // Side bar section header border color.
  },
  titleBar: {
    activeBackground: '#343434', // Title Bar background when the window is active.
    activeForeground: '#c5c5c5', // Title Bar foreground when the window is active.
    inactiveBackground: '#2c2c2d', // Title Bar background when the window is inactive.
    inactiveForeground: '#878787' // Title Bar foreground when the window is inactive.
    // border: '#1c1c1c', // Title bar border color.
  },
  statusBar: {
    background: '#037acc', // Standard Status Bar background color.
    foreground: '#ffffff', // Status Bar foreground color.
    border: '#037acc', // Status Bar border color separating the Status Bar and editor.
    noFolderForeground: '#ffffff', // Status Bar foreground color when no folder is opened.
    noFolderBackground: '#68217a', // Status Bar background color when no folder is opened.
    noFolderBorder: '#68217a' // Status Bar border color separating the Status Bar and editor when no folder is opened.
  },
  statusBarItem: {
    activeBackground: '#037acc', // Status Bar item background color when clicking.
    hoverBackground: '#238bd2', // Status Bar item background color when hovering.
    prominentBackground: '#037acc', // Status Bar prominent items background color. Prominent items stand out from other Status Bar entries to indicate importance.
    prominentHoverBackground: '#238bd2' // Status Bar prominent items background color when hovering. Prominent items stand out from other Status Bar entries to indicate importance.
  },
  activityBar: {
    background: '#333333', // Activity Bar background color.
    foreground: '#ffffff', // Activity bar foreground color (for example used for the icons).
    inactiveForeground: '#b4b4b4', //  Activity bar item foreground color when it is inactive.
    badgeBackground: '#006fc5', //'#ffc600',
    badgeForeground: '#fff'
  },
  brandPage: {
    background: '#293742', //"#2c2c2c",
    foreground: '#ffffff',
    logoOpacity: 0.6
  },
  editorGroupHeader: {
    tabsBackground: '#212121' // Background color of the Tabs container
  },
  tab: {
    activeBackground: '#1c1c1c', //Active Tab background color.
    activeForeground: '#ffffff', //Active Tab foreground color in an active group.
    border: '#212121', //Border to separate Tabs from each other.
    activeBorder: '#6fa0f6', //Bottom border for the active tab.
    activeBorderTop: '#1c1c1c', //Top border for the active tab.
    inactiveBackground: '#282828', //Inactive Tab background color.
    inactiveForeground: '#676767', //Inactive Tab foreground color in an active group.
    hoverBackground: '#282828', //Tab background color when hovering
    hoverBorder: '#282828', //Border to highlight tabs when hovering
    activeModifiedBorder: '#1c1c1c', //Border on the top of modified (dirty) active tabs in an active group.
    inactiveModifiedBorder: '#282828' //Border on the top of modified (dirty) inactive tabs in an active group.
  },
  list: {
    activeSelectionBackground: '#75715E', // List/Tree background color for the selected item when the list/tree is active.
    activeSelectionForeground: '#ffffff', // List/Tree foreground color for the selected item when the list/tree is active.
    focusBackground: '#414339', // List/Tree background color for the focused item when the list/tree is active.
    focusForeground: '#c3c3c3', // List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    hoverBackground: '#3e3d32', // List/Tree background when hovering over items using the mouse.
    hoverForeground: '#c3c3c3', // List/Tree foreground when hovering over items using the mouse.
    inactiveSelectionBackground: '#414339', // List/Tree background color for the selected item when the list/tree is inactive.
    inactiveSelectionForeground: '#c3c3c3', // List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.
    inactiveFocusBackground: '#', // List background color for the focused item when the list is inactive. An active list has keyboard focus, an inactive does not. Currently only supported in lists.
    invalidItemForeground: '#B89500', // List/Tree foreground color for invalid items, for example an unresolved root in explorer.
    errorForeground: '#F48771', //  Foreground color of list items containing errors.
    warningForeground: '#4d9e4d' // Foreground color of list items containing warnings.
  },
  editor: {
    background: '#1c1c1c', // Editor background color.
    foreground: '#ffffff', // Editor default foreground color.
    lineNumberForeground: '#dddddd', // Color of editor line numbers.
    lineNumberActiveForeground: '#ffffff', // Color of the active editor line number.
    cursorBackground: '#0000ff', // The background color of the editor cursor. Allows customizing the color of a character overlapped by a block cursor.
    cursorForeground: '#ffffff' // Color of the editor cursor.
  }
}
