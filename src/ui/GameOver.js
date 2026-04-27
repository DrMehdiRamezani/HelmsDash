// src/ui/GameOver.js
import { SaveManager } from '../core/SaveManager.js';

export class GameOver {
  constructor(onRestart, onQuit) {
    this._el = null;
    this._onRestart = onRestart;
    this._onQuit = onQuit;
  }

  show({ xp, coins, playerName, isNewHighScore }) {
    if (this._el) this._el.remove();

    const el = document.createElement('div');
    el.className = 'game-overlay';
    el.id = 'game-over';
    el.innerHTML = `
      <div class="overlay-card">
        <div class="overlay-title">⚔️ Fallen!</div>
        <div class="overlay-subtitle">${playerName || 'Knight'}'s run has ended</div>

        ${isNewHighScore ? `<div style="color:#f5c842;font-size:0.85rem;margin-bottom:12px;letter-spacing:0.1em;">✨ NEW BEST RUN! ✨</div>` : ''}

        <div class="overlay-stat-row">
          <span>Final Score</span>
          <span>⭐ ${Math.floor(xp).toLocaleString()}</span>
        </div>
        <div class="overlay-stat-row">
          <span>Coins Collected</span>
          <span>💰 ${coins.toLocaleString()}</span>
        </div>
        <div class="overlay-stat-row">
          <span>Best Score</span>
          <span>⭐ ${SaveManager.getHighScore().toLocaleString()}</span>
        </div>

        <button class="big-btn" id="restart-btn">⚔️ Run Again!</button>
        <button class="ghost-btn" id="quit-go-btn">🏠 Return to Village</button>
      </div>
    `;

    document.getElementById('app').appendChild(el);
    this._el = el;

    el.querySelector('#restart-btn').addEventListener('click', () => {
      this.hide();
      this._onRestart();
    });
    el.querySelector('#quit-go-btn').addEventListener('click', () => {
      this.hide();
      this._onQuit();
    });
  }

  hide() {
    if (!this._el) return;
    this._el.classList.add('fade-out');
    setTimeout(() => { this._el?.remove(); this._el = null; }, 400);
  }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
