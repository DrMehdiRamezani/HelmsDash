// src/entities/VibejamPortal.js
// Rare portal that appears at jetpack coin altitude every 3rd jetpack — opens vibej.am on collect

import * as THREE from 'three';

const PORTAL_URL    = 'https://vibej.am/2026/';
const COLLECT_RADIUS = 1.6;

export class VibejamPortal {
  constructor(scene, x, y, z) {
    this._scene     = scene;
    this._collected = false;
    this._time      = 0;

    this.group = new THREE.Group();
    this.group.position.set(x, y, z);

    // Core ring
    const ringGeo = new THREE.TorusGeometry(1.1, 0.1, 20, 72);
    const ringMat = new THREE.MeshStandardMaterial({
      color:             0xaa00ff,
      emissive:          0x7700cc,
      emissiveIntensity: 2.5,
      metalness:         0.4,
      roughness:         0.2,
    });
    this._ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this._ring);

    // Inner fill disc (gives a "portal window" feel)
    const discGeo = new THREE.CircleGeometry(0.95, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color:       0x5500aa,
      transparent: true,
      opacity:     0.35,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      side:        THREE.DoubleSide,
    });
    this._disc = new THREE.Mesh(discGeo, discMat);
    this.group.add(this._disc);

    // Outer soft halo — two overlapping larger tori for depth
    for (const [r, t, op] of [[1.45, 0.28, 0.18], [1.75, 0.4, 0.08]]) {
      const hGeo = new THREE.TorusGeometry(r, t, 8, 64);
      const hMat = new THREE.MeshBasicMaterial({
        color:       0xcc44ff,
        transparent: true,
        opacity:     op,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
      });
      this.group.add(new THREE.Mesh(hGeo, hMat));
    }

    // Purple point light so nearby coins/walls pick up the glow
    this._light = new THREE.PointLight(0xaa00ff, 4, 10);
    this.group.add(this._light);

    scene.add(this.group);
  }

  update(dt) {
    if (this._collected) return;
    this._time += dt;

    // Slow spin on Y, gentle wobble on Z
    this._ring.rotation.y += dt * 1.2;
    this._ring.rotation.z  = Math.sin(this._time * 0.8) * 0.18;
    this._disc.rotation.z += dt * 0.4;

    // Pulse halo + light
    const pulse = 0.7 + 0.3 * Math.sin(this._time * 5.0);
    this._light.intensity = 4 * pulse;

    // Subtle scale breathe on the whole group
    const s = 1.0 + 0.04 * Math.sin(this._time * 3.0);
    this.group.scale.setScalar(s);
  }

  // Returns true if the player touched the portal
  checkCollect(playerWorldPos) {
    if (this._collected) return false;
    if (playerWorldPos.distanceTo(this.group.position) < COLLECT_RADIUS) {
      this._collected = true;
      this.group.visible = false;
      window.open(PORTAL_URL, '_blank', 'noopener');
      return true;
    }
    return false;
  }

  destroy() {
    this._scene.remove(this.group);
  }

  get collected() { return this._collected; }
}
