import Fragment from './slide-fragment'

export default Fragment(`
precision mediump float;

uniform float iGlobalTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

vec2 doModel(vec3 p);
float sphere(vec3 p, float r);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: gauss = require('glsl-specular-gaussian')
#pragma glslify: ruler = require('glsl-ruler/color')
#pragma glslify: smin = require('glsl-smooth-min')
#pragma glslify: fog = require('glsl-fog')

vec2 doModel(vec3 p) {
  vec3 off = vec3(0, 0, sin(iGlobalTime) * 1.25);
  float d1 = sphere(p - off, 0.65);
  float d2 = sphere(p + off, 0.65);

  float d = smin(d1, d2, 0.5);

  return vec2(d, 0.0);
}

float sphere(vec3 p, float r) {
  return length(p) - r;
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

float intersectPlane(vec3 ro, vec3 rd, vec3 nor, float dist) {
  float denom = dot(rd, nor);
  float t = -(dot(ro, nor) + dist) / denom;

  return t;
}

void main() {
  vec3 color = vec3(1.0);
  vec3 ro, rd;

  float rotation = iGlobalTime * 0.5;
  float height   = (iMouse.y / iResolution.y + 0.1) * 5.0;
  float dist     = 4.0;
  camera(rotation, height, dist, iResolution.xy, ro, rd);

  float u = intersectPlane(ro, rd, vec3(0, 1, 0), 0.0);
  vec2  t = raytrace(ro, rd, 75., 0.01);

  if (max(t.x, u) < 0.0) {
    gl_FragColor = vec4(1);
    return;
  }

  bool plane = (u > 0.0 && t.x > u) || (t.x < 0.0 && u > 0.0);

  if (plane) {
    vec3 pos = ro + rd * u;
    vec3 nor = vec3(0, 1, 0);
    color = ruler(doModel(pos).x);
  } else {
    vec3 pos = ro + rd * t.x;
    vec3 nor = normal(pos);

    vec3 ldir1 = normalize(vec3(-0.25, 1, -1));
    vec3 ldir2 = normalize(vec3(0, -0.8, 1));

    color = reflect(nor, rd) * 0.5 + 0.5;
    color += 0.4 * gauss(ldir1, -rd, nor, 0.5);
    color.g = smoothstep(-0.09, 1.1, color.g);
    color.r = smoothstep(0.0, 1.02, color.r);
    color.b += 0.015;
  }

  color = mix(color, vec3(1.5, 1.2, 1), fog(plane ? u : t.x, 0.08125));
  color = pow(color, vec3(0.75));

  gl_FragColor.rgb = color.rgb;
  gl_FragColor.a   = 1.0;
}
`.trim())
