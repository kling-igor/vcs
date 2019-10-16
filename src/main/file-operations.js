import { readdir, stat, mkdirp, readFile, writeFile, rename, existsSync, remove, copy, unlink } from 'fs-extra'
import chokidar from 'chokidar'
import readChunk from 'read-chunk'
import fileType from 'file-type'
import { join, resolve, extname } from 'path'
import { Emitter } from 'event-kit'

const IGNORED = ['.DS_Store', '.Trash', 'node_modules', '.git', '.hg', '.svn', 'controllers_compiled']

const MIME = {
  js: 'text/plain',
  json: 'text/plain',
  txt: 'text/plain',
  svg: 'image/svg'
}

class ProjectFileOperations {
  projectPath = null

  constructor(fileOps) {
    this.fileOps = fileOps
  }

  async open(projectPath) {
    this.projectPath = projectPath
    return this.fileOps.openProject(projectPath)
  }

  close() {
    this.projectPath = null
    return this.fileOps.closeProject()
  }

  async create(projectPath) {
    if (this.projectPath) return

    this.projectPath = projectPath
    await this.fileOps.createFolder(projectPath)
    await this.createFolder('views')
    await this.createFolder('controllers')
  }

  async readFileTree(whiteList = []) {
    if (this.projectPath) return

    return this.fileOps.readProjectFileTree(this.projectPath, whiteList)
  }

  async rename(src, dst) {
    if (!this.projectPath) return
    return this.fileOps.rename(resolve(this.projectPath, src), resolve(this.projectPath, dst))
  }

  async createFolder(folderPath) {
    if (!this.projectPath) return
    return this.fileOps.createFolder(resolve(this.projectPath, folderPath))
  }

  async removeFile(filePath) {
    if (!this.projectPath) return
    return this.fileOps.removeFile(resolve(this.projectPath, filePath))
  }

  async removeFolder(folderPath) {
    if (!this.projectPath) return
    return this.fileOps.removeFolder(resolve(this.projectPath, folderPath))
  }

  async getFileType(filePath) {
    if (!this.projectPath) return
    return this.fileOps.getFileType(resolve(this.projectPath, filePath))
  }

  async openFile(filePath) {
    if (!this.projectPath) return
    return this.fileOps.openFile(resolve(this.projectPath, filePath))
  }

  async saveFile(filePath, buffer) {
    if (!this.projectPath) return
    return this.fileOps.saveFile(resolve(this.projectPath, filePath), buffer)
  }
}

export class FileSystemOperations {
  watcher
  initialScanComplete = false

  notifier = null

  awaitingOperations = {
    add: [],
    change: [],
    unlink: [],
    addDir: [],
    unlinkDir: []
  }

  constructor() {
    this._project = new ProjectFileOperations(this)
  }

  get project() {
    return this._project
  }

  /**
   * Reads file tree recursively ignoring some of inappropriate folders
   * @returns {Promise} - promise resolved by tree of objects {path: String, fileName: String, !children:[]} where path is relative to original directory
   * @throws {Error} - Directory doesn't match project structure.
   */
  readProjectFileTree(dirPath, whiteList = []) {
    const regex = new RegExp(`^${dirPath}\/?`)

    const readDir = async (dir, isRoot = false) => {
      let childFiles = (await readdir(dir)).map(fileName => ({
        fileName,
        path: dir.replace(regex, '')
      }))

      const ignoredPaths = []

      for (const item of childFiles) {
        if (IGNORED.includes(item.fileName)) {
          ignoredPaths.push(item)
          continue
        }

        if (isRoot && whiteList.length > 0) {
          // TODO: use config settings (as function parameter!!!)
          const rootAllowedItems = [
            'controllers',
            'models',
            'views',
            'styles',
            'services',
            'printforms',
            'translations',
            'files',
            'package.json',
            'README.md'
          ]
          if (!rootAllowedItems.includes(item.fileName)) {
            ignoredPaths.push(item)
            continue
          }
        }

        const fullPath = join(dirPath, item.path, item.fileName)
        const fileInfo = await stat(fullPath)
        if (fileInfo.isDirectory()) {
          item.children = await readDir(fullPath)
        }
      }

      return childFiles.filter(item => !ignoredPaths.includes(item))
    }

    return readDir(dirPath, true)
  }

  // async createProject(projectPath) {
  //   await this.createFolder(projectPath)

  //   await this.createFolder(join(projectPath, 'views'))
  //   await this.createFolder(join(projectPath, 'controllers'))
  // }

  /**
   * reads folder tree and starts watching for changes
   */
  openProject(projectPath) {
    if (!existsSync(projectPath)) return Promise.reject(`Path '${projectPath}' does not exist`)

    return new Promise((resolve, reject) => {
      this.readProjectFileTree()
        .then(fileTree => {
          this.notifier = new Emitter()

          this.awaitingOperations = {
            add: [],
            change: [],
            unlink: [],
            addDir: [],
            unlinkDir: []
          }

          this.watcher = chokidar.watch(projectPath, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignorePermissionErrors: true
          })

          // https://github.com/paulmillr/chokidar/issues/303
          this.watcher
            .on('ready', () => {
              this.initialScanComplete = true
              this.notifier.emit('ready', fileTree)
            })
            .on('add', path => {
              if (!this.initialScanComplete) return

              console.log('watcher add:', path)

              if (this.awaitingOperations.add.includes(path)) return

              console.log(`File ${path} has been added`)
              this.notifier.emit('path-add', path)
            })
            .on('unlink', path => {
              if (!this.initialScanComplete) return

              console.log('watcher remove:', path)

              if (this.awaitingOperations.unlink.includes(path)) return

              console.log(`File ${path} has been removed`)
              this.notifier.emit('path-remove', path)
            })
            .on('addDir', path => {
              if (!this.initialScanComplete) return
              if (this.awaitingOperations.addDir.includes(path)) return

              console.log(`Directory ${path} has been added`)
              this.notifier.emit('path-add', path)
            })
            .on('unlinkDir', path => {
              if (!this.initialScanComplete) return
              if (this.awaitingOperations.unlinkDir.includes(path)) return

              console.log(`Directory ${path} has been removed`)
              this.notifier.emit('path-remove', path)
            })
            .on('change', (path, stats) => {
              if (!this.initialScanComplete) return
              if (this.awaitingOperations.change.includes(path)) return

              if (stats) console.log(`File ${path} changed size to ${stats.size}`)

              this.notifier.emit('path-change', path) // in case of change outside of IDE
            })
            .on('error', error => {
              console.log(`Watcher error: ${error}`)
            })

          resolve(this.notifier)
        })
        .catch(reject)
    })
  }

  closeProject() {
    if (this.notifier) {
      this.notifier.dispose()
      this.notifier.clear()
      this.notifier = null
    }

    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }

    this.awaitingOperations = {
      add: [],
      change: [],
      unlink: [],
      addDir: [],
      unlinkDir: []
    }
  }

  /**
   * Renames file
   * @param {String} src
   * @param {String} dst
   */
  async rename(src, dst) {
    if (src === dst) return
    if (!existsSync(src)) return

    let fileAddResolve
    let fileRemoveResolve
    let guardResolve
    let guardReject
    let timerId

    const checkTimeout = () => {
      if (timerId) {
        clearTimeout(timerId)
        timerId = null
        guardResolve()
      } else {
        timerId = setTimeout(guardReject, 500)
      }
    }

    const onFileAdd = file => {
      console.log('onFileAdd:', file)

      if (file === dst) {
        checkTimeout()
        fileAddResolve(dst)
      }
    }

    const onFileRemove = file => {
      console.log('onFileRemove:', file)

      if (file === src) {
        checkTimeout()
        fileRemoveResolve(src)
      }
    }

    this.watcher.on('add', onFileAdd)
    this.watcher.on('unlink', onFileRemove)

    const cleanUp = () => {
      this.watcher.removeListener('add', onFileAdd)
      this.watcher.removeListener('unlink', onFileRemove)

      fileRemoveResolve = null
      fileAddResolve = null
      guardResolve = null
      guardReject = null
    }

    const unblockNotifier = () => {
      this.forgetPathOpeartions(src, 'unlink', 'unlinkDir')
      this.forgetPathOpeartions(dst, 'add', 'addDir')
    }

    Promise.all([
      new Promise(resolve => {
        fileRemoveResolve = resolve
      }),
      new Promise(resolve => {
        fileAddResolve = resolve
      }),
      new Promise((resolve, reject) => {
        guardResolve = resolve
        guardReject = reject
      })
    ])
      .then(([source, destination]) => {
        cleanUp()
        unblockNotifier()
        this.notifier.emit('path-rename', [source, destination])
      })
      .catch(() => {
        cleanUp()
        unblockNotifier()
        // nothing will happened on error...
      })

    // глушим notifier
    this.awaitPathOperations(src, 'unlink', 'unlinkDir')
    this.awaitPathOperations(dst, 'add', 'addDir')

    // actual fs operation
    return rename(src, dst)
  }

  async createFolder(folderPath) {
    try {
      await mkdirp(folderPath)
    } catch (err) {
      console.error(err)
    }
  }

  async removeFile(filePath) {
    try {
      await unlink(filePath)
    } catch (err) {
      console.error(err)
    }
  }

  async removeFolder(folderPath) {
    try {
      await remove(folderPath)
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * @param {String} filePath
   * @returns {ext:String, mime:String}
   */
  async getFileType(filePath) {
    const ext = extname(filePath).slice(1)

    const mime = MIME[ext]

    if (mime) {
      return { ext, mime }
    }

    const buffer = await readChunk(filePath, 0, fileType.minimumBytes)
    return fileType(buffer)
  }

  async openFile(filePath) {
    return readFile(filePath, { encoding: 'utf-8' })
  }

  // https://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-doesnt-exist
  async saveFile(filePath, buffer) {
    this.awaitPathOperations(filePath, 'add', 'change')

    return new Promise((resolve, reject) => {
      return writeFile(filePath, buffer, { encoding: 'utf-8' })
        .then(() => {
          this.forgetPathOpeartions(filePath, 'add', 'change')
          resolve()
        })
        .catch(reject)
    })
  }

  awaitPathOperations(path, ...operations) {
    operations.forEach(operation => this.awaitingOperations[operation].push(path))
  }

  forgetPathOpeartions(path, ...operations) {
    operations.forEach(operation => {
      this.awaitingOperations[operation] = this.awaitingOperations[operation].filter(item => item !== path)
    })
  }
}
