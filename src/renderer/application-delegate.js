const { ipcRenderer } = window.require('electron')
import { callMain } from './ipc'
import { Disposable } from 'event-kit'

export class ApplicationDelegate {
  async openProject(projectPath) {
    return callMain('open-project', projectPath)
  }

  async removeFile(path) {
    console.log('APP DELEGATE REMOVE:', path)
    return callMain('remove-file', path)
  }

  closeProject() {
    return ipcRenderer.send('close-project')
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