import debounce from 'debounce'
import Emitter from 'events/'

export default (gl, editor) => {
  console.log('instantiating')

  editor.editor.on('change', change = debounce(change, 500))

  return new Emitter()
    .on('render', render)
    .on('dispose', dispose)

  function render () {
    console.log('rendering')
  }

  function dispose () {
    editor.editor.off('change', change)
    console.log('disposing')
  }

  function change () {
    console.log('// changing')
  }
}
