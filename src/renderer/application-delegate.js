const { ipcRenderer } = window.require('electron')
import { callMain } from './ipc'
import { Disposable } from 'event-kit'

import * as MESSAGES from '../common/messages'

export class ApplicationDelegate {
  async openProject(projectPath, whiteList = []) {
    return callMain(MESSAGES.PROJECT_OPEN, projectPath, ...whiteList)
  }

  async removeFile(path) {
    console.log('APP DELEGATE REMOVE:', path)
    return callMain(MESSAGES.PROJECT_REMOVE_FILE, path)
  }

  closeProject() {
    return ipcRenderer.send(MESSAGES.PROJECT_CLOSE)
  }

  onProjectFilePathAdd(handler) {
    ipcRenderer.on('file-tree:path-add', handler)
    return new Disposable(() => ipcRenderer.removeListener('file-tree:path-add', handler))
  }

  onProjectFilePathRemove(handler) {
    ipcRenderer.on('file-tree:path-remove', handler)
    return new Disposable(() => ipcRenderer.removeListener('file-tree:path-remove', handler))
  }

  onProjectFilePathRename(handler) {
    ipcRenderer.on('file-tree:path-rename', handler)
    return new Disposable(() => ipcRenderer.removeListener('file-tree:path-rename', handler))
  }

  onProjectFilePathChange(handler) {
    ipcRenderer.on('file-tree:path-change', handler)
    return new Disposable(() => ipcRenderer.removeListener('file-tree:path-change', handler))
  }
}
