// src/ui/PauseMenu.js
export class PauseMenu {
  constructor(onResume, onQuit) {
    this._el = null;
    this._build(onResume, onQuit);
  }

  _build(onResume, onQuit) {
    const el = document.createElement('div');
    el.className = 'game-overlay';
    el.id = 'pause-menu';
    el.innerHTML = `
      <div class="overlay-card">
        <div class="overlay-title">Paused</div>
        <div class="overlay-subtitle">Your quest awaits, knight</div>
        <button class="big-btn" id="resume-btn">▶ Resume Run</button>
        <button class="ghost-btn" id="quit-btn">🏠 Return to Village</button>
      </div>
    `;
    document.getElementById('app').appendChild(el);
    this._el = el;

    el.querySelector('#resume-btn').addEventListener('click', onResume);
    el.querySelector('#quit-btn').addEventListener('click', onQuit);
  }

  show() { if (this._el) this._el.style.display = 'flex'; }
  hide() { if (this._el) this._el.style.display = 'none'; }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
