// src/powerups/Magnet.js
import { Collectible } from '../entities/Collectible.js';
import { CONFIG } from '../config.js';

export class Magnet extends Collectible {
  constructor() {
    super({
      type:     'magnet',
      duration: CONFIG.MAGNET_DURATION,
      icon:     '🧲',
      label:    'Magnet',
      onActivate: () => {},
      onExpire:   () => {},
    });
  }
}
