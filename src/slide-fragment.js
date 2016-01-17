import Triangle from 'gl-big-triangle'
import Client from 'glslify-client'
import Cursor from 'touch-position'
import debounce from 'debounce'
import Emitter from 'events/'
import Shader from 'gl-shader'
import xhr from 'xhr'

export default (frag) => {
  const vert = `
  precision mediump float;

  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 1, 1);
  }
  `

  var value = frag
  var compiled
  var triangle

  const compile = Client((source, done) => {
    xhr({
      uri: 'http://glslb.in/-/shader',
      method: 'POST',
      body: source
    }, (err, res, tree) => {
      if (err) return done(err)

      try {
        tree = JSON.parse(tree)
      } catch (err) {
        return done(err)
      }

      done(null, tree)
    })
  })

  const ratio = window.devicePixelRatio || 1

  return (gl, editor) => {
    const shape = new Float32Array(2)
    const start = Date.now()
    const canvas = gl.canvas
    const cursor = Cursor.emitter({ element: canvas })

    var shader

    triangle = triangle || Triangle(gl)

    editor.editor.setValue(value)
    editor.editor.on('change', change = debounce(change, 500))
    triangle.bind()

    compile(value, (err, source) => {
      if (err) throw err
      compiled = source

      if (shader) {
        shader.update(vert, compiled)
      } else {
        shader = Shader(gl, vert, compiled)
      }
    })

    return new Emitter()
      .on('render', render)
      .on('dispose', dispose)

    function render () {
      if (!shader) return

      const { width, height } = canvas

      gl.viewport(0, 0, shape[0] = width, shape[1] = height)
      gl.disable(gl.CULL_FACE)
      gl.disable(gl.DEPTH_TEST)

      shader.bind()
      shader.uniforms.iGlobalTime = (Date.now() - start) / 1000
      shader.uniforms.iResolution = shape
      shader.uniforms.iMouse = [cursor.position[0] * ratio, cursor.position[1] * ratio]
      triangle.draw()
    }

    function dispose () {
      editor.editor.off('change', change)
      shader.dispose()
      cursor.dispose()
      shader = null
    }

    function change () {
      compile(value = editor.editor.getValue(), (err, result) => {
        try {
          if (err) throw err
          shader.update(vert, compiled = result)
        } catch (e) {
          console.clear()
          console.warn(e.message)
        }
      })
    }
  }
}
