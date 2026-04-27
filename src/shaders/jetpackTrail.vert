// Jetpack trail vertex shader
attribute float aSize;
attribute float aAlpha;
varying float vAlpha;
uniform float uTime;

void main() {
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
