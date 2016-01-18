import Geometry from 'gl-geometry'
import faceNorm from 'face-normals'
import unindex from 'unindex-mesh'
import Shader from 'gl-shader'
import Emitter from 'events/'
import mat4 from 'gl-mat4'
import bunny from 'bunny'

const positions = unindex(bunny)
const normals = faceNorm(positions)
const size = positions.length / 3

export default (gl, editor) => {
  const canvas = gl.canvas
  const view = mat4.create()
  const proj = mat4.create()
  const geom = Geometry(gl)
    .attr('position', positions)
    .attr('normal', normals)

  const eye = [0, 4, 20]
  const origin = [0, 4, 0]
  const up = [0, 1, 0]
  const start = Date.now()

  const shader = Shader(gl, `
    precision mediump float;

    attribute vec3 position;
    attribute vec3 normal;
    uniform mat4 proj;
    uniform mat4 view;
    uniform float time;
    varying vec3 vnorm;

    void main() {
      float explode = max(0.0, sin(time + position.y * 0.175 + sin(position.x * position.z) * 0.1) - 0.1);

      vnorm = normal;

      gl_Position = proj * view * vec4(position + vnorm * explode * 25., 1);
    }
  `, `
    precision mediump float;

    varying vec3 vnorm;

    void main() {
      vec3 normal = normalize(vnorm);
      vec3 ldir = vec3(0, 1, 0);
      float mag = max(0.0, dot(normal, ldir));

      gl_FragColor = vec4(mag, mag + 0.035, mag + 0.08, 1);
    }
  `)

  return new Emitter()
    .on('render', render)
    .on('dispose', dispose)

  function render () {
    const { width, height } = canvas

    gl.viewport(0, 0, width, height)
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    eye[0] = Math.sin(Date.now() / 1500) * 23
    eye[2] = Math.cos(Date.now() / 1500) * 23

    mat4.perspective(proj, Math.PI / 4, width / height, 0.1, 100)
    mat4.lookAt(view, eye, origin, up)

    geom.bind(shader)
    shader.uniforms.proj = proj
    shader.uniforms.view = view
    shader.uniforms.time = (Date.now() - start) / 1000
    geom.draw()
  }

  function dispose () {
    geom.dispose()
  }
}
