const { ipcRenderer } = window.require('electron')
import { callMain } from './ipc'
import { Disposable } from 'event-kit'

import * as MESSAGES from '../common/messages'

export class ApplicationDelegate {
  async openProject(projectPath, whiteList = []) {
    return callMain(MESSAGES.CORE_OPEN_PROJECT, projectPath, ...whiteList)
  }

  async removeFile(path) {
    console.log('APP DELEGATE REMOVE:', path)
    return callMain(MESSAGES.CORE_REMOVE_FILE, path)
  }

  closeProject() {
    return ipcRenderer.send(MESSAGES.CORE_CLOSE_PROJECT)
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
