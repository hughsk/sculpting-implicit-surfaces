import Fragment from './slide-fragment'

export default Fragment(`
precision mediump float;

uniform float iGlobalTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

vec2 doModel(vec3 p);

#pragma glslify: square = require('glsl-square-frame')

vec3 draw_line(float d, float thickness) {
  const float aa = 2.0;
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

float box(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

void main() {
  vec3 color = vec3(1.0);
  vec2 uv = square(iResolution.xy, gl_FragCoord.xy);
  vec2 suv = square(iResolution.xy, floor(gl_FragCoord.xy / 16.0) * 16.);
  float index = (suv.x * 2.0 + 1.0) + (suv.y * 2.0 + 1.0) * (square(iResolution.xy, floor(iResolution.xy / 16.0) * 16.).x * 2.0 + 1.0);

  if (abs(uv.x) < 1.2 && abs(uv.y) < 0.8) {
    if (index + 5. < mod(iGlobalTime * 5., 25.)) color = vec3(abs(suv), 1);
  }

  color *= draw_line(box(uv, vec2(1.2, 0.8)), 0.00125);
  color *= draw_line(shape_segment(uv, -vec2(1.2, 0.8), vec2(1.2, 0.8)), 0.00125);

  gl_FragColor.rgb = color.bgr;
  gl_FragColor.a   = 1.0;
}
`.trim())
