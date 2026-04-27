// Coin spin vertex shader
varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Spin around Y axis
  float angle = uTime * 2.5;
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec3 pos = position;
  float x = cosA * pos.x - sinA * pos.z;
  float z = sinA * pos.x + cosA * pos.z;
  pos = vec3(x, pos.y, z);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
