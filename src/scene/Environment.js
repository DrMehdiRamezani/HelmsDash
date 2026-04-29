// src/scene/Environment.js
// Procedural side decorations: buildings, trees, alleys, banners

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { getAsset } from '../core/AssetRegistry.js';

const TRACK_HALF_WIDTH = CONFIG.LANE_SPACING * (CONFIG.LANE_COUNT / 2) + 0.5;
const SIDE_OFFSET = TRACK_HALF_WIDTH + 1.5; // distance from track centre to building edge

export class Environment {
  constructor(scene) {
    this._scene = scene;
    this._leftObjects  = [];
    this._rightObjects = [];
    this._totalZ = 0; // how far we've generated
    this._stripLength = 60; // generate in strips
  }

  init() {
    const strips = 4;
    for (let i = 0; i < strips; i++) {
      this._generateStrip(this._totalZ);
      this._totalZ -= this._stripLength;
    }
  }

  _generateStrip(startZ) {
    const len = this._stripLength;

    // Left side
    let z = startZ;
    while (z > startZ - len) {
      const type = this._pickBuildingType();
      const obj = this._buildSideObject(type, 'left');
      if (!obj) { z -= 8; continue; }
      obj.position.set(-SIDE_OFFSET - obj.userData.halfW, 0, z - obj.userData.depth / 2);
      this._scene.add(obj);
      this._leftObjects.push(obj);
      z -= obj.userData.depth + 0.5 + Math.random() * 2;
    }

    // Right side
    z = startZ;
    while (z > startZ - len) {
      const type = this._pickBuildingType();
      const obj = this._buildSideObject(type, 'right');
      if (!obj) { z -= 8; continue; }
      obj.position.set(SIDE_OFFSET + obj.userData.halfW, 0, z - obj.userData.depth / 2);
      this._scene.add(obj);
      this._rightObjects.push(obj);
      z -= obj.userData.depth + 0.5 + Math.random() * 2;
    }
  }

  _pickBuildingType() {
    const r = Math.random();
    if (r < CONFIG.TREE_FREQUENCY) return 'tree';
    const buildingTypes = CONFIG.BUILDING_TYPES;
    return buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
  }

  _buildSideObject(type, side) {
    let obj;
    if (type === 'tree') {
      obj = getAsset('environment/tree_oak');
      obj.userData.halfW = 1.0;
      obj.userData.depth = 2.0;
    } else if (type === 'building_a') {
      obj = getAsset('environment/building_a');
      obj.userData.halfW = 2.2;
      obj.userData.depth = 4.0;
    } else if (type === 'building_b') {
      obj = getAsset('environment/building_b');
      obj.userData.halfW = 1.8;
      obj.userData.depth = 4.0;
    } else if (type === 'alley') {
      // Alley gap — just place a banner overhead
      obj = getAsset('environment/banner');
      obj.userData.halfW = 0.1;
      obj.userData.depth = 2.0;
    } else {
      return null;
    }

    if (side === 'right') obj.scale.x = -1; // mirror for right side
    return obj;
  }

  update(dz) {
    const moveAll = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        arr[i].position.z += dz;
        // Remove if too far behind camera
        if (arr[i].position.z > CONFIG.DESPAWN_Z + 10) {
          this._scene.remove(arr[i]);
          arr.splice(i, 1);
        }
      }
    };

    this._totalZ += dz; // keep leading edge in sync with world scroll

    moveAll(this._leftObjects);
    moveAll(this._rightObjects);

    // Generate more strips until we have content at least LOOKAHEAD units ahead
    const LOOKAHEAD = 120;
    while (this._totalZ > -LOOKAHEAD) {
      this._totalZ -= this._stripLength;
      this._generateStrip(this._totalZ);
    }
  }

  reset() {
    [...this._leftObjects, ...this._rightObjects].forEach(o => this._scene.remove(o));
    this._leftObjects = [];
    this._rightObjects = [];
    this._totalZ = 0;
  }
}
