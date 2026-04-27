// Buff glow vertex shader — animated outline/pulse on player during active buff
varying vec3 vNormal;
uniform float uTime;
uniform float uIntensity;

void main() {
  vNormal = normalize(normalMatrix * normal);
  // Slight pulsing expansion
  float pulse = 1.0 + sin(uTime * 6.0) * 0.04 * uIntensity;
  vec3 pos = position + normal * 0.04 * uIntensity;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * pulse, 1.0);
}
