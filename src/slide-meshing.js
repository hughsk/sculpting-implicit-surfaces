import getBounds from 'gl-volume-bound'
import faceNormals from 'face-normals'
import surfaceNets from 'surface-nets'
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

float sminP(in float a, in float b);
float map(vec3 p);

#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: smin = require('glsl-smooth-min')

float geometry(vec3 p) {
  float d1 = p.y - cos(p.z * 5.) * sin(p.x * 5.) * 0.15 + 0.5;
  float d2 = length(p) - 0.125;
  float d3 = p.y - noise2(p.xz) * 0.1 + 0.3;
  float d4 = d2 + noise3(p * 3.) * 0.05;

  return min(d1, d2);
}

// Shane's "Entangled Vines" Geometry <3
// https://www.shadertoy.com/view/MlBSDW
float map(vec3 p) {
  p *= 1.75;
  p += 5.;
  vec2 perturb = vec2(sin((p.z * 2.15 + p.x * 2.35)), cos((p.z * 1.15 + p.x * 1.25)));
  vec2 perturb2 = vec2(cos((p.z * 1.65 + p.y * 1.75)), sin((p.z * 1.4 + p.y * 1.6)));
  vec2 q1 = mod(p.xy + vec2(0.25, -0.5), 2.) - 1.0 + perturb*vec2(0.25, 0.5);
  vec2 q2 = mod(p.yz + vec2(0.25, 0.25), 2.) - 1.0 - perturb*vec2(0.25, 0.3);
  vec2 q3 = mod(p.xz + vec2(-0.25, -0.5), 2.) - 1.0 - perturb2*vec2(0.25, 0.4);
  p = sin(p*8. + cos(p.yzx*8.));
  float s1 = length( q1 ) - 0.24; // max(abs(q1.x), abs(q1.y)) - 0.2; // etc.
  float s2 = length( q2 ) - 0.24;
  float s3 = length( q3 ) - 0.24;
  return sminP(sminP(s1, s3), s2) - p.x*p.y*p.z*0.05;
}

// Smooth minimum function. Hardcoded with the smoothing value "0.25."
float sminP(in float a, in float b ){
  float h = clamp(2.*(b - a) + 0.5, 0.0, 1.0);
  return (b - 0.25*h)*(1. - h) + a*h;
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
      gl_FragColor = vec4(spec + reflect(normalize(vnorm), -vdir) * 0.5 + 0.5, 1);
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
        var positions = unindex(mesh.positions, mesh.cells)
        // var norm = faceNormals(positions)
        var norm = unindex(normals.vertexNormals(mesh.cells, mesh.positions), mesh.cells)

        var final = Geom(gl)
          .attr('position', positions)
          .attr('normal', norm)

        if (geom) geom.dispose()
        geom = final
      })
    })
  }
}
