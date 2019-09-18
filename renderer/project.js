import { EventEmitter } from 'events'
import { join } from 'path'
export class Project extends EventEmitter {
  projectPath = null
  applicationDelegate = null

  constructor({ applicationDelegate }) {
    super()
    this.applicationDelegate = applicationDelegate
  }

  async open({ projectPath }) {
    await this.applicationDelegate.openProject(projectPath)

    this.projectPath = projectPath

    this.emit('project-opened')
  }

  close() {
    this.projectPath = null

    this.projectName = null

    this.emit('project-closed')
  }

  async removeFile(path) {
    return this.applicationDelegate.removeFile(join(this.projectPath, path))
  }
}
