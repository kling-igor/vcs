import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export class FileWrapper {
  static createTextFile({ path, content }) {
    return new FileWrapper({ path, content, type: 'text' })
  }
  static createImageFile({ path, tmpPath }) {
    return new FileWrapper({ path, tmpPath, type: 'image' })
  }

  static createBinaryDataFile({ path, tmpPath }) {
    return new FileWrapper({ path, tmpPath, type: 'binary' })
  }

  /**
   *
   * @param {String} path - path inside project
   * @param {String} tmpPath - path of temporal file (used in diff)
   * @param {String} content - textual content
   * @param {String} type - one of: text | image | binary
   */
  constructor({ path, tmpPath, content = '', type }) {
    this._type = type
    this._path = path
    this._tmpPath = tmpPath
    if (type === 'text') {
      this.monacoModel = monaco.editor.createModel(content)
    }
  }

  get content() {
    if (this.type === 'text') return this.monacoModel
    if (this.type === 'image') return this._tmpPath
  }

  get type() {
    return this._type
  }

  get path() {
    return this._path
  }
}
