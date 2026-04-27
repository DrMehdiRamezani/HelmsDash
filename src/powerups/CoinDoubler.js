// src/powerups/CoinDoubler.js
import { Collectible } from '../entities/Collectible.js';
import { CONFIG } from '../config.js';

export class CoinDoubler extends Collectible {
  constructor() {
    super({
      type:     'doubler',
      duration: CONFIG.DOUBLER_DURATION,
      icon:     '×2',
      label:    'Coin ×2',
      onActivate: () => {},
      onExpire:   () => {},
    });
  }
}
