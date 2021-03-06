import React, { useEffect, useRef, memo } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import styled from 'styled-components'

const RootStyle = styled.div`
  width: 100%;
  height: 100%;
`

const noop = () => {}

const DiffEditor = memo(({ originalFile, modifiedFile, width, height, textEditorDidMount = noop }) => {
  const editorRef = useRef(null)

  useEffect(() => {
    if (!originalFile || !modifiedFile) {
      const editor = monaco.editor.create(editorRef.current, {
        selectOnLineNumbers: true,
        readOnly: true,
        lineNumbers: 'on',
        model: null
      })

      const model = (originalFile && originalFile.content) || (modifiedFile && modifiedFile.content)

      editor.setModel(model)

      textEditorDidMount(editor, monaco)

      return () => {
        editor.dispose()
      }
    }

    const diffEditor = monaco.editor.createDiffEditor(editorRef.current, {
      enableSplitViewResizing: true,
      // renderSideBySide: true,
      selectOnLineNumbers: true,
      readOnly: false,
      // originalEditable: false, // for left pane
      // readOnly: true,         // for right pane

      // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
      lineNumbers: 'on' // "on" | "off" | "relative" | "interval" | function
    })

    diffEditor.setModel({
      original: originalFile.content,
      modified: modifiedFile.content
    })

    textEditorDidMount(diffEditor, monaco)

    return () => {
      diffEditor.dispose()
    }
  }, [width, height, originalFile, modifiedFile])

  return <RootStyle ref={editorRef} />
})

export default DiffEditor
