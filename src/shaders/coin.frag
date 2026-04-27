// Coin fragment shader — gold shimmer
varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;

void main() {
  vec3 goldBase  = vec3(1.0, 0.82, 0.1);
  vec3 goldShine = vec3(1.0, 0.98, 0.6);
  
  // Fresnel-like rim glow
  float rim = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  float shimmer = 0.5 + 0.5 * sin(uTime * 4.0 + vUv.x * 10.0);
  
  vec3 col = mix(goldBase, goldShine, rim * 0.6 + shimmer * 0.2);
  float emissive = 0.25 + 0.15 * shimmer;
  
  gl_FragColor = vec4(col + col * emissive, 1.0);
}
