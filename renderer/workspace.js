import { remote } from 'electron'

// STUB
export default class Workspace {
  showContextMenu({ title, items }) {
    const contextMenu = new remote.Menu()
    if (title) {
      contextMenu.append(new remote.MenuItem({ label: title, enabled: false }))
      contextMenu.append(new remote.MenuItem({ type: 'separator' }))
    }

    const menuItems = Array.isArray(items) ? items : items()

    menuItems.forEach(({ type = 'normal', label, enabled, click }) => {
      contextMenu.append(new remote.MenuItem({ type, label, click, enabled: enabled != null ? enabled : true }))
    })

    contextMenu.popup()
  }
}
