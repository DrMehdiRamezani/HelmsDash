// Jetpack trail fragment shader
varying float vAlpha;

void main() {
  // Circular soft point
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float alpha = (1.0 - dist * 2.0) * vAlpha;
  vec3 color = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.9, 0.3), 1.0 - dist * 2.0);
  
  gl_FragColor = vec4(color, alpha);
}
