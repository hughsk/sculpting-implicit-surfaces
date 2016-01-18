import getBounds from 'gl-volume-bound'
import surfaceNets from 'surface-nets'
import Triangle from 'gl-big-triangle'
import Client from 'glslify-client'
import Cursor from 'touch-position'
import unindex from 'unindex-mesh'
import debounce from 'debounce'
import Geom from 'gl-geometry'
import normals from 'normals'
import Emitter from 'events/'
import Shader from 'gl-shader'
import mat4 from 'gl-mat4'
import xhr from 'xhr'

const frag = `
precision mediump float;

#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: smin = require('glsl-smooth-min')

float geometry(vec3 p) {
  float d1 = p.y - cos(p.z * 5.) * sin(p.x * 5.) * 0.15 + 0.5;
  float d2 = length(p) - 0.125;
  float d3 = p.y - noise2(p.xz) * 0.1 + 0.3;
  float d4 = d2 + noise3(p * 3.) * 0.05;

  return max(d1, d2);
}
`.trim()

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

export default (gl, editor) => {
  const proj = mat4.create()
  const view = mat4.create()
  const shape = new Float32Array(2)
  const start = Date.now()
  const canvas = gl.canvas
  const cursor = Cursor.emitter({ element: canvas })
  const shader = Shader(gl, `
    precision mediump float;

    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 proj;
    uniform mat4 view;

    varying vec3 vnorm;
    varying vec3 vpos;

    void main() {
      vnorm = normal;
      vpos = position;
      gl_Position = proj * view * vec4(position, 1);
    }
  `, `
    precision mediump float;

    varying vec3 vnorm;
    varying vec3 vpos;
    uniform vec3 eye;

    float gauss(
      vec3 lightDirection,
      vec3 viewDirection,
      vec3 surfaceNormal,
      float shininess) {
      vec3 H = normalize(lightDirection + viewDirection);
      float theta = acos(dot(H, surfaceNormal));
      float w = theta / shininess;
      return exp(-w*w);
    }

    void main() {
      vec3 ldir = vec3(0, 1, 0);
      vec3 vdir = normalize(eye - vpos);

      float spec = gauss(ldir, vdir, vnorm, 0.3) * 0.65;
      gl_FragColor = vec4(spec + normalize(vnorm) * 0.5 + 0.5, 1);
    }
  `)

  var geom

  editor.editor.setValue(value)
  editor.editor.on('change', change = debounce(change, 1000))
  updateMesh(value)

  return new Emitter()
    .on('render', render)
    .on('dispose', dispose)

  function render () {
    if (!geom) return

    const { width, height } = canvas

    gl.viewport(0, 0, shape[0] = width, shape[1] = height)
    gl.disable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const eye = [
      (cursor.position[0] / width * 2 - 1) * 120,
      +120,
      (cursor.position[1] / height * 2 - 1) * 120
    ]

    mat4.perspective(proj, Math.PI / 4, width / height, 0.1, 300)
    mat4.lookAt(view, eye, [48, 48, 48], [0, 1, 0])

    geom.bind(shader)
    shader.uniforms.proj = proj
    shader.uniforms.view = view
    shader.uniforms.eye = eye
    geom.draw()
  }

  function dispose () {
    editor.editor.off('change', change)
    shader.dispose()
    cursor.dispose()
    geom.dispose()
    geom = null
  }

  function change () {
    updateMesh(value = editor.editor.getValue())
  }

  function updateMesh (value) {
    compile(value, (err, source) => {
      if (err) throw err

      getBounds(gl, compiled = source, {
        volume: [96, 96, 96]
      }, (err, result) => {
        if (err) throw err

        var mesh = surfaceNets(result, 0)
        var norm = unindex(normals.vertexNormals(mesh.cells, mesh.positions), mesh.cells)
        var positions = unindex(mesh.positions, mesh.cells)

        var final = Geom(gl)
          .attr('position', positions)
          .attr('normal', norm)

        if (geom) geom.dispose()
        geom = final
      })
    })
  }
}
