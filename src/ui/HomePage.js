// src/ui/HomePage.js
// Splash screen — name input, high score display, begin button

import { SaveManager } from '../core/SaveManager.js';

export class HomePage {
  constructor(onStart) {
    this._onStart = onStart;
    this._el = null;
    this._build();
  }

  _build() {
    const el = document.createElement('div');
    el.id = 'homepage';

    const highScore = SaveManager.getHighScore();
    const savedName = SaveManager.getPlayerName();

    el.innerHTML = `
      <div class="hp-card">
        <div class="hp-logo">HelmsDash</div>
        <div class="hp-tagline">A Medieval Endless Run</div>

        ${highScore > 0 ? `<div class="hp-highscore">Best Run: <span>⭐ ${highScore.toLocaleString()}</span></div>` : ''}

        <div class="hp-label">What is your name, knight?</div>
        <input
          type="text"
          class="hp-input"
          id="player-name-input"
          placeholder="Enter your name…"
          maxlength="20"
          value="${savedName}"
          autocomplete="off"
        />

        <button class="big-btn" id="begin-btn">⚔️ Begin the Run!</button>
      </div>
    `;

    document.getElementById('app').appendChild(el);
    this._el = el;

    const input = el.querySelector('#player-name-input');
    const beginBtn = el.querySelector('#begin-btn');

    const start = () => {
      const name = input.value.trim() || 'Knight';
      SaveManager.setPlayerName(name);
      this._dismiss(() => this._onStart(name));
    };

    beginBtn.addEventListener('click', start);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') start();
    });

    // Auto-focus name field
    setTimeout(() => input.focus(), 100);
  }

  _dismiss(cb) {
    this._el.classList.add('fade-out');
    setTimeout(() => {
      this._el.remove();
      this._el = null;
      cb?.();
    }, 400);
  }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
