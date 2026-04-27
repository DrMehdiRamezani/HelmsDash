// Ground fog fragment shader — low rolling mist
varying vec3 vWorldPos;
varying vec2 vUv;
uniform float uTime;

void main() {
  // Height-based fog: dense near ground (y < 0.5), clear above 1.5
  float fogHeight = clamp(1.0 - vWorldPos.y / 1.2, 0.0, 1.0);
  
  // Animated noise-like swirl using sine waves
  float swirl = sin(vWorldPos.x * 0.5 + uTime * 0.4) *
                sin(vWorldPos.z * 0.3 + uTime * 0.25) * 0.5 + 0.5;
  
  float fogDensity = fogHeight * swirl * 0.22;
  vec3 fogColor = vec3(0.78, 0.71, 0.60);
  
  gl_FragColor = vec4(fogColor, fogDensity);
}
