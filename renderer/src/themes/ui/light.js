// https://code.visualstudio.com/api/references/theme-color

export default {
  type: 'light',
  contrastBorder: '#000000', //An extra border around elements to separate them from others for greater contrast.
  contrastActiveBorder: '#000000', //An extra border around active elements to separate them from others for greater contrast.

  focusBorder: '#000000', //Overall border color for focused elements. This color is only used if not overridden by a component.
  foreground: '#000000', //Overall foreground color. This color is only used if not overridden by a component.

  selection: {
    background: '#ffff00' //Background color of text selections in the workbench (for input fields or text areas, does not apply to selections within the editor and the terminal).
  },
  descriptionForeground: '#ff00ff', //Foreground color for description text providing additional information, for example for a label.
  errorForeground: '##ff0000', //Overall foreground color for error messages (this color is only used if not overridden by a component).
  sideBar: {
    background: '#fafbfc', //Side Bar background color.
    foreground: '#586069', //Side Bar foreground color. The Side Bar is the container for views like Explorer and Search.
    border: '#fafbfc' //Side Bar border color on the side separating the editor.
  },

  sideBarTitle: {
    foreground: '#24292e' //Side Bar title foreground color.
  },
  sideBarSectionHeader: {
    background: '#f1f2f3', // Side Bar section header background color.
    foreground: '#24292e' // Side Bar section header foreground color.
    // border: '#00ff00' // Side bar section header border color.
  },
  titleBar: {
    activeBackground: '#d8d8d8', // Title Bar background when the window is active.
    activeForeground: '#2d2d2d', // Title Bar foreground when the window is active.
    inactiveBackground: '#e2e2e2', // Title Bar background when the window is inactive.
    inactiveForeground: '#808080' // Title Bar foreground when the window is inactive.
    // border: '#cccccc', // Title bar border color.
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
    background: '#b4b4b4', // Activity Bar background color.
    foreground: '#000000', // Activity bar foreground color (for example used for the icons).
    inactiveForeground: '#666666', //  Activity bar item foreground color when it is inactive.
    badgeBackground: '#54a3ff',
    badgeForeground: '#fff'
  },
  brandPage: {
    background: '#ffffff', // b4b4b4
    foreground: '#757575',
    logoOpacity: 0.3
  },
  editorGroupHeader: {
    tabsBackground: '#f1f1f1' // Background color of the Tabs container
  },
  tab: {
    activeBackground: '#ffffff', //Active Tab background color.
    activeForeground: '#3a3a3a', //Active Tab foreground color in an active group.
    border: '#f1f1f1', //Border to separate Tabs from each other.
    activeBorder: '#66BB6A', //Bottom border for the active tab.
    activeBorderTop: '#ffffff', //Top border for the active tab.
    inactiveBackground: '#f1f1f1', //Inactive Tab background color.
    inactiveForeground: '#6c6c6c', //Inactive Tab foreground color in an active group.
    hoverBackground: '#f1f1f1', //Tab background color when hovering
    hoverBorder: '#f1f1f1', //Border to highlight tabs when hovering
    activeModifiedBorder: '#ffffff', //Border on the top of modified (dirty) active tabs in an active group.
    inactiveModifiedBorder: '#f1f1f1' //Border on the top of modified (dirty) inactive tabs in an active group.
  },
  list: {
    activeSelectionBackground: '#e0e2ef', // List/Tree background color for the selected item when the list/tree is active.
    activeSelectionForeground: '#5b5b5b', // List/Tree foreground color for the selected item when the list/tree is active.
    focusBackground: '#f1f1f1', // List/Tree background color for the focused item when the list/tree is active.
    focusForeground: '#5b5b5b', // List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.
    hoverBackground: '#e5e5e5', // List/Tree background when hovering over items using the mouse.
    hoverForeground: '#5b5b5b', // List/Tree foreground when hovering over items using the mouse.
    inactiveSelectionBackground: '#e5e5e5', // List/Tree background color for the selected item when the list/tree is inactive.
    inactiveSelectionForeground: '#5b5b5b', // List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.
    inactiveFocusBackground: '#bababa', // List background color for the focused item when the list is inactive. An active list has keyboard focus, an inactive does not. Currently only supported in lists.
    invalidItemForeground: '#B89500', // List/Tree foreground color for invalid items, for example an unresolved root in explorer.
    errorForeground: '#A1260D', //  Foreground color of list items containing errors.
    warningForeground: '#117711' //  Foreground color of list items containing warnings.
  },
  editor: {
    background: '#f1f1f1', // Editor background color.
    foreground: '#3a3a3a', // Editor default foreground color.
    lineNumberForeground: '#dddddd', // Color of editor line numbers.
    lineNumberActiveForeground: '#ffffff', // Color of the active editor line number.
    cursorBackground: '#0000ff', // The background color of the editor cursor. Allows customizing the color of a character overlapped by a block cursor.
    cursorForeground: '#ffffff' // Color of the editor cursor.
  }
}
