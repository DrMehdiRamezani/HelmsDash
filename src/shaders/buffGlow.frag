// Buff glow fragment shader — coloured outline glow
varying vec3 vNormal;
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

void main() {
  float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  float pulse = 0.7 + 0.3 * sin(uTime * 6.0);
  float alpha = rim * rim * pulse * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
