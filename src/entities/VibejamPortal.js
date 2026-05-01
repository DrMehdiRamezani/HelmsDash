// src/entities/VibejamPortal.js
// Portal that redirects to the Vibe Jam 2026 webring (or back to a ref game).

import * as THREE from 'three';

const EXIT_URL       = 'https://vibej.am/portal/2026';
const COLLECT_RADIUS = 1.6;

// Build the redirect URL with Vibe Jam query params.
function buildPortalUrl(baseUrl, { username, speed, hp, ref, extra = {} } = {}) {
  const u = new URL(baseUrl);
  // Re-apply any params that were forwarded from the incoming portal (continuity)
  for (const [k, v] of Object.entries(extra)) {
    if (k !== 'portal' && k !== 'ref') u.searchParams.set(k, v);
  }
  // Our own values override whatever was in extra
  if (username) u.searchParams.set('username', username);
  if (speed    != null) u.searchParams.set('speed', String(Math.round(speed)));
  if (hp       != null) u.searchParams.set('hp', String(Math.round(hp)));
  u.searchParams.set('color', 'gold');
  if (ref)     u.searchParams.set('ref', ref);
  return u.toString();
}

// The game's own URL (no query params) — used as ?ref= when exiting.
const GAME_URL = window.location.origin + window.location.pathname;

export class VibejamPortal {
  /**
   * @param {THREE.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {object} [opts]
   * @param {string} [opts.refUrl]   If set this is a return portal — redirect here instead of webring
   * @param {string} [opts.label]    Override the floating label text
   */
  constructor(scene, x, y, z, opts = {}) {
    this._scene     = scene;
    this._collected = false;
    this._time      = 0;
    this._refUrl    = opts.refUrl || null;   // null = exit portal; string = return portal
    this._label     = opts.label  || (this._refUrl ? '← Return Portal' : 'Vibe Jam Portal');

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

    // Tint return portals gold/orange to visually distinguish them
    if (this._refUrl) {
      ringMat.color.setHex(0xff8800);
      ringMat.emissive.setHex(0xcc4400);
      discMat.color.setHex(0x884400);
      this._light = new THREE.PointLight(0xff6600, 4, 10);
    } else {
      this._light = new THREE.PointLight(0xaa00ff, 4, 10);
    }
    this.group.add(this._light);

    // Floating label via CSS2DObject substitute — use a sprite canvas texture
    this._labelSprite = this._makeLabel(this._label, !!this._refUrl);
    this._labelSprite.position.set(0, 1.8, 0);
    this.group.add(this._labelSprite);

    scene.add(this.group);
  }

  _makeLabel(text, isReturn) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 80);
    ctx.fillStyle = isReturn ? 'rgba(255,140,0,0.85)' : 'rgba(170,0,255,0.85)';
    ctx.roundRect(8, 8, 496, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 0.5, 1);
    return sprite;
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

  /**
   * Call every frame. Pass current player name + game speed so they get
   * forwarded to the next game via query params.
   * Returns true on the frame the portal is entered.
   */
  /**
   * @param {THREE.Vector3} playerWorldPos
   * @param {object} opts
   * @param {string}  opts.username
   * @param {number}  opts.speed        — m/s
   * @param {number}  opts.hp           — 0..MAX_HP (will be normalised to 1..100)
   * @param {number}  opts.maxHp        — for normalisation
   * @param {object}  opts.incomingParams — original ?params from portal arrival, forwarded on return
   */
  checkCollect(playerWorldPos, { username = '', speed = 0, hp = null, maxHp = 10, incomingParams = {} } = {}) {
    if (this._collected) return false;
    if (playerWorldPos.distanceTo(this.group.position) < COLLECT_RADIUS) {
      this._collected    = true;
      this.group.visible = false;

      const hpNorm = hp != null ? Math.max(1, Math.round((hp / maxHp) * 100)) : null;

      const destination = this._refUrl
        // Return portal — redirect back to the source game, forwarding all original params
        ? buildPortalUrl(this._refUrl, { username, speed, hp: hpNorm, ref: GAME_URL, extra: incomingParams })
        // Exit portal — send player into the Vibe Jam webring
        : buildPortalUrl(EXIT_URL, { username, speed, hp: hpNorm, ref: GAME_URL });

      window.location.href = destination;
      return true;
    }
    return false;
  }

  destroy() {
    this._scene.remove(this.group);
  }

  get collected() { return this._collected; }
}
