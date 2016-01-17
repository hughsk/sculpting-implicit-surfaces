import Fragment from './slide-fragment'

export default Fragment(`
precision mediump float;

uniform float iGlobalTime;
uniform vec2  iResolution;
uniform vec2  iMouse;

vec2 doModel(vec3 p);

vec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir, float maxd, float precis) {
  float latest = precis * 2.0;
  float dist   = +0.0;
  float type   = -1.0;
  vec2  res    = vec2(-1.0, -1.0);

  for (int i = 0; i < 70; i++) {
    if (latest < precis || dist > maxd) break;

    vec2 result = doModel(rayOrigin + rayDir * dist);

    latest = result.x;
    type   = result.y;
    dist  += latest;
  }

  if (dist < maxd) {
    res = vec2(dist, type);
  }

  return res;
}

vec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir) {
  return calcRayIntersection(rayOrigin, rayDir, 20.0, 0.001);
}

vec3 calcNormal(vec3 pos, float eps) {
  const vec3 v1 = vec3( 1.0,-1.0,-1.0);
  const vec3 v2 = vec3(-1.0,-1.0, 1.0);
  const vec3 v3 = vec3(-1.0, 1.0,-1.0);
  const vec3 v4 = vec3( 1.0, 1.0, 1.0);

  return normalize( v1 * doModel( pos + v1*eps ).x +
                    v2 * doModel( pos + v2*eps ).x +
                    v3 * doModel( pos + v3*eps ).x +
                    v4 * doModel( pos + v4*eps ).x );
}

vec3 calcNormal(vec3 pos) {
  return calcNormal(pos, 0.002);
}

vec2 squareFrame(vec2 screenSize, vec2 coord) {
  vec2 position = 2.0 * (coord.xy / screenSize.xy) - 1.0;
  position.x *= screenSize.x / screenSize.y;
  return position;
}

mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(target - origin);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));

  return mat3(uu, vv, ww);
}

vec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {
  return normalize(camMat * vec3(screenPos, lensLength));
}

vec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {
  mat3 camMat = calcLookAtMatrix(origin, target, 0.0);
  return getRay(camMat, screenPos, lensLength);
}

void orbitCamera(
  in float camAngle,
  in float camHeight,
  in float camDistance,
  in vec2 screenResolution,
  out vec3 rayOrigin,
  out vec3 rayDirection,
  in vec2 coord
) {
  vec2 screenPos = squareFrame(screenResolution, coord);
  vec3 rayTarget = vec3(0.0);

  rayOrigin = vec3(
    camDistance * sin(camAngle),
    camHeight,
    camDistance * cos(camAngle)
  );

  rayDirection = getRay(rayOrigin, rayTarget, screenPos, 2.0);
}

float sdBox(vec3 position, vec3 dimensions) {
  vec3 d = abs(position) - dimensions;

  return min(max(d.x, max(d.y,d.z)), 0.0) + length(max(d, 0.0));
}

float gaussianSpecular(
  vec3 lightDirection,
  vec3 viewDirection,
  vec3 surfaceNormal,
  float shininess) {
  vec3 H = normalize(lightDirection + viewDirection);
  float theta = acos(dot(H, surfaceNormal));
  float w = theta / shininess;
  return exp(-w*w);
}

const float PI = 3.14159265359;

vec2 rotate2D(vec2 p, float a) {
 return p * mat2(cos(a), -sin(a), sin(a),  cos(a));
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 gradient(float t) {
  return palette(t,
    vec3(0.5),
    vec3(0.5),
    vec3(0.5, 0.25, 0.39),
    vec3(0.35, 0.25, 0.15)
  );
}

float modAngle(inout vec2 p, float a) {
  float a1 = atan(p.y, p.x);
  float a2 = mod(a1 + a * 0.5, a) - a * 0.5;

  p = vec2(cos(a2), sin(a2)) * length(p);

  return mod(floor(a1 / a + 0.5), 2.0 * PI / a);
}

float modRot(inout vec2 p, float i) {
  return modAngle(p, 2.0 * PI / i);
}

vec2 doModel(vec3 p) {
  float off2 = iGlobalTime * -0.5 + sin(iGlobalTime * 2.) * 0.4;
  float off1 = 1.7 + sin(-iGlobalTime * 3.) * .25;
  float bsize = 0.1 - pow(abs(p.y / off1), 20.05) * 0.15;
  float d = length(p) - 1.;

  d += sin((p.x * p.y * p.z) * 10. - iGlobalTime * 5.) * 0.025;
  d = min(d, length(abs(p) - vec3(0, off1, 0)) - 0.3);

  modRot(p.xz, 8.0);
  p.yx = rotate2D(p.yx, off2);
  modRot(p.yx, 6.0);

  p.xz = rotate2D(p.xz, iGlobalTime * 2. + sin(iGlobalTime * 2.) * 2.);
  float d2 = sdBox(p - vec3(0, off1, 0), vec3(bsize)) - 0.02;

  d = min(d, d2);

  return vec2(d, 0.0);
}

vec3 bg(vec3 ro, vec3 rd) {
  return gradient(rd.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 ro, rd;

  vec2  uv       = squareFrame(iResolution.xy, fragCoord.xy);
  float rotation = iGlobalTime * 0.85;
  float height   = 0.1;
  float dist     = 4.5;

  orbitCamera(rotation, height, dist, iResolution.xy, ro, rd, fragCoord.xy);

  vec3 color = mix(bg(ro, rd) * 1.5, vec3(1), 0.125);
  vec2 t = calcRayIntersection(ro, rd, 8., 0.005);
  if (t.x > -0.5) {
    vec3 pos = ro + rd * t.x;
    vec3 nor = calcNormal(pos);
    color = bg(pos, reflect(rd, nor));
    color += gaussianSpecular(vec3(0, 1, 0), -rd, nor, 0.415) * 1.0;
  }

  color = mix(color, vec3(1), 0.5);
  color -= dot(uv, uv * 0.155) * vec3(0.5, 1, 0.7) * 0.9;
  color.r = smoothstep(0.1, 0.9, color.r);
  color.g = smoothstep(0.0, 1.1, color.g);
  color.b = smoothstep(0.05, 1.0, color.b);

  fragColor.rgb = color;
  fragColor.a   = 1.0;
}

void main() {
  vec4 color = vec4(0);

  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`.trim())
