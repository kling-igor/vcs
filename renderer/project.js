import { EventEmitter } from 'events'

export class Project extends EventEmitter {
  projectPath = null

  constructor({ applicationDelegate }) {
    super()
    this.applicationDelegate = applicationDelegate
  }

  async open({ projectPath }) {
    await this.applicationDelegate.openProject(projectPath)

    this.projectPath = projectPath

    this.emit('project-opened')
  }
}
