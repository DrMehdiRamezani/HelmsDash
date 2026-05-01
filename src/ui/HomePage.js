// src/ui/HomePage.js
// Splash screen — name input, high score display, begin button

import { SaveManager } from '../core/SaveManager.js';
import { fetchTopScores } from '../leaderboard.js';

export class HomePage {
  constructor(onStart, onThemeChange) {
    this._onStart = onStart;
    this._onThemeChange = onThemeChange;
    this._el = null;
    this._build();
  }

  _build() {
    const el = document.createElement('div');
    el.id = 'homepage';

    const highScore = SaveManager.getHighScore();
    const savedName = SaveManager.getPlayerName();
    const savedTheme = SaveManager.getTheme();

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

        <div class="hp-label" style="margin-bottom:10px;">Render Style</div>
        <div class="hp-theme-toggle">
          <button class="hp-theme-btn ${savedTheme === 'normal' ? 'active' : ''}" data-theme="normal">
            <span class="hp-theme-icon">🏰</span>
            Normal
          </button>
          <button class="hp-theme-btn ${savedTheme === 'pixel' ? 'active' : ''}" data-theme="pixel">
            <span class="hp-theme-icon">🎮</span>
            Pixel Art
          </button>
        </div>

        <button class="big-btn" id="begin-btn">⚔️ Begin the Run!</button>

        <div style="margin-top:18px;width:100%;">
          <div style="font-size:0.75rem;opacity:0.5;letter-spacing:0.1em;margin-bottom:6px;">🏆 TOP KNIGHTS</div>
          <div id="hp-leaderboard" style="font-size:0.78rem;opacity:0.8;">Loading…</div>
        </div>
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

    el.querySelectorAll('.hp-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.hp-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.dataset.theme;
        SaveManager.setTheme(theme);
        this._onThemeChange?.(theme);
      });
    });

    // Auto-focus name field
    setTimeout(() => input.focus(), 100);

    // Load leaderboard
    fetchTopScores().then(scores => {
      const lbEl = el.querySelector('#hp-leaderboard');
      if (!lbEl) return;
      if (!scores.length) { lbEl.textContent = 'No runs yet — be the first!'; return; }
      lbEl.innerHTML = scores.map(s =>
        `<div style="display:flex;justify-content:space-between;padding:2px 0;">
          <span><span style="opacity:0.4">#${s.rank} </span>${s.name}</span>
          <span>💰 ${s.score.toLocaleString()}</span>
        </div>`
      ).join('');
    }).catch(() => {
      const lbEl = el.querySelector('#hp-leaderboard');
      if (lbEl) lbEl.textContent = '';
    });
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
