import Fragment from './slide-fragment'

export default Fragment(`
precision mediump float;

uniform float iGlobalTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

vec2 doModel(vec3 p);

#pragma glslify: square = require('glsl-square-frame')

vec3 draw_line(float d, float thickness) {
  const float aa = 2.5;
  return vec3(smoothstep(0.0, aa / iResolution.y, max(0.0, abs(d) - thickness)));
}

float shape_line(vec2 p, vec2 a, vec2 b) {
  vec2 dir = b - a;
  return abs(dot(normalize(vec2(dir.y, -dir.x)), a - p));
}

float shape_segment(vec2 p, vec2 a, vec2 b) {
  float d = shape_line(p, a, b);
  float d0 = dot(p - b, b - a);
  float d1 = dot(p - a, b - a);
  return d1 < 0.0 ? length(a - p) : d0 > 0.0 ? length(b - p) : d;
}

void main() {
  vec3 color = vec3(1.0);
  vec2 uv = square(iResolution.xy, gl_FragCoord.xy) * 1.2;
  vec3 lineColor = vec3(0, 0.175, 1);

  float t = length(uv) - 1.0;

  color *= draw_line(uv.x, 0.00125);
  color *= draw_line(uv.y, 0.00125);
  color -= lineColor * (1.0 - draw_line(t, 0.0035));

  gl_FragColor.rgb = color.bgr;
  gl_FragColor.a   = 1.0;
}
`.trim())
