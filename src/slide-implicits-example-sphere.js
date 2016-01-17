import Fragment from './slide-fragment'

export default Fragment(`
precision mediump float;

uniform float iGlobalTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

vec2 doModel(vec3 p);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: gauss = require('glsl-specular-gaussian')
#pragma glslify: square = require('glsl-square-frame')

float cylinder(vec3 p, vec3 c) {
  return length(p.xz-c.xy)-c.z;
}

vec2 oUnion(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

vec2 doModel(vec3 p) {
  vec2 sphere = vec2(length(p) - 1., 0.0);
  float axes = 9999.;

  axes = min(axes, cylinder(p.xyz, vec3(0, 0, 0.02)));
  axes = min(axes, cylinder(p.yxz, vec3(0, 0, 0.02)));
  axes = min(axes, cylinder(p.xzy, vec3(0, 0, 0.02)));

  return oUnion(sphere, vec2(axes, 1.0));
}

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
  return a + b*cos( 6.28318*(c*t+d) );
}

vec3 bg(vec3 ro, vec3 rd) {
  float t = rd.y * 0.4 + 0.4;
  vec3 grad = vec3(0.1, 0.05, 0.15) + palette(t
    , vec3(0.55, 0.5, 0.5)
    , vec3(0.6, 0.6, 0.5)
    , vec3(0.9, 0.6, 0.45)
    , vec3(0.03, 0.15, 0.25)
  );

  return grad;
}

void main() {
  vec2 uv = square(iResolution.xy);
  vec3 color = vec3(1.0);
  vec3 ro, rd;

  float rotation = iMouse.x / iResolution.x * 12.56;
  float height   = (1.0 - iMouse.y / iResolution.y * 2.0) * 5.0;
  float dist     = 4.0;
  camera(rotation, height, dist, iResolution.xy, ro, rd);

  vec2 t = raytrace(ro, rd);
  if (t.x > -0.5) {
    if (t.y == 1.0) {
      color = vec3(0, -0.1, 0.05);
    } else {
      vec3 pos = ro + rd * t.x;
      vec3 nor = normal(pos);

      color = reflect(nor, rd) * 0.5 + 0.5;

      vec3 ldir1 = normalize(vec3(-0.25, 1, -1));
      vec3 ldir2 = normalize(vec3(0, -0.8, 1));

      color += 0.4 * gauss(ldir1, -rd, nor, 0.175);
      color = pow(color, vec3(0.7575));
    }
  }

  color += pow(dot(uv, uv * 0.8), 1.5);

  gl_FragColor.rgb = color.rgb;
  gl_FragColor.a   = 1.0;
}
`.trim())
