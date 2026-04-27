// src/powerups/SprintShoes.js
import { Collectible } from '../entities/Collectible.js';
import { CONFIG } from '../config.js';

export class SprintShoes extends Collectible {
  constructor() {
    super({
      type:     'sprint',
      duration: CONFIG.SPRINT_DURATION,
      icon:     '👟',
      label:    'Sprint',
      onActivate: (player) => {
        // Speed multiplier is read from player.speedMultiplier in Game
      },
      onExpire: (player) => {
        // Speed returns to normal automatically via player.hasPowerup check
      },
    });
  }
}
