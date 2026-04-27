// src/entities/Collectible.js
// Base class for all power-up collectibles

export class Collectible {
  /**
   * @param {object} options
   * @param {string}   options.type       - 'sprint' | 'magnet' | 'doubler' | 'jetpack'
   * @param {number}   options.duration   - seconds active
   * @param {string}   options.icon       - emoji or asset key for HUD
   * @param {string}   options.label      - display name in buff bar
   * @param {function} options.onActivate - (player, game) => void
   * @param {function} options.onExpire   - (player, game) => void
   */
  constructor({ type, duration, icon, label, onActivate, onExpire }) {
    this.type       = type;
    this.duration   = duration;
    this.icon       = icon;
    this.label      = label;
    this.timer      = duration;
    this._onActivate = onActivate || (() => {});
    this._onExpire   = onExpire   || (() => {});
  }

  onActivate(player, game) { this._onActivate(player, game); }
  onExpire(player, game)   { this._onExpire(player, game); }

  /** Returns 0..1 fraction remaining */
  get fraction() { return Math.max(0, this.timer / this.duration); }
}
