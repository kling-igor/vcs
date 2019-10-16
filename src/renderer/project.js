import { EventEmitter } from 'events'
import { join, basename } from 'path'
export class Project extends EventEmitter {
  projectPath = null
  applicationDelegate = null

  constructor({ applicationDelegate }) {
    super()
    this.applicationDelegate = applicationDelegate
  }

  async open({ projectPath, whiteList = [] }) {
    // todo:  если тут доступна config, то whitelist брать из нее!!!

    await this.applicationDelegate.openProject(projectPath, whiteList)

    this.projectPath = projectPath

    this.projectName = basename(projectPath)

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
