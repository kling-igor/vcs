import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export class FileWrapper {
  static createTextFile({ path, content }) {
    return new FileWrapper({ path, content, type: 'text' })
  }
  static createImageFile({ path }) {
    return new FileWrapper({ path, type: 'image' })
  }

  static createBinaryDataFile({ path }) {
    return new FileWrapper({ path, type: 'binary' })
  }

  constructor({ path, content = '', type }) {
    this._type = type
    this._path = path
    if (type === 'text') {
      this.monacoModel = monaco.editor.createModel(content)
    }
  }

  get content() {
    if (this.type === 'text') return this.monacoModel
    if (this.type === 'image') return this.path
  }

  get type() {
    return this._type
  }

  get path() {
    return this._path
  }
}
