import CodeMirror from 'codemirror'
import Emitter from 'events/'

require('./editor-glsl')(CodeMirror)
require('./editor-search')(CodeMirror)
require('./editor-sublime')(CodeMirror)

export default () => new Editor()

class Editor extends Emitter {
  constructor () {
    super()

    const container = document.getElementById('editor')
    const editor = new CodeMirror(container, {
      theme: 'dracula',
      mode: 'glsl',
      matchBrackets: true,
      indentWithTabs: false,
      styleActiveLine: true,
      showCursorWhenSelecting: true,
      viewportMargin: Infinity,
      keyMap: 'sublime',
      indentUnit: 2,
      tabSize: 2,
      value: 'precision mediump float;'
    })

    this.container = container
    this.editor = editor

    window.addEventListener('resize', () => {
      if (document.body.parentNode.classList.contains('editor-enabled')) {
        setTimeout(() => editor.focus())
      }
    }, false)
  }
}
