// src/ui/VirtualControls.js
// Touch-only virtual controls: action buttons (left) + lane joystick (right)
// Only rendered on devices that have a coarse pointer (touchscreen).

export class VirtualControls {
  constructor(inputManager) {
    this._input = inputManager;
    this._el    = null;

    // Joystick state
    this._joystickActive  = false;
    this._joystickTouchId = null;
    this._joystickOriginX = 0;
    this._lastLane        = 0; // -1 left, 0 neutral, 1 right

    if (!window.matchMedia('(pointer: coarse)').matches) return;
    this._build();
  }

  _build() {
    const el = document.createElement('div');
    el.id = 'vctrl';
    el.innerHTML = `
      <div id="vctrl-actions">
        <button class="vctrl-btn" id="vctrl-jump">▲<span>Jump</span></button>
        <button class="vctrl-btn" id="vctrl-roll">▼<span>Roll</span></button>
      </div>
      <div id="vctrl-joystick-wrap">
        <div id="vctrl-joystick-track">
          <div id="vctrl-joystick-thumb"></div>
        </div>
        <div id="vctrl-joystick-labels">
          <span>◀</span><span>▶</span>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(el);
    this._el = el;

    // Action buttons — fire on touchstart for instant response
    const bindAction = (id, action) => {
      const btn = el.querySelector(id);
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        this._input._emit(action);
      }, { passive: false });
    };
    bindAction('#vctrl-jump', 'jump');
    bindAction('#vctrl-roll', 'roll');

    // Joystick
    const joystickWrap  = el.querySelector('#vctrl-joystick-wrap');
    const thumb         = el.querySelector('#vctrl-joystick-thumb');
    const DEAD_ZONE     = 12;  // px — no action until dragged past this
    const MAX_TRAVEL    = 36;  // px — clamp thumb visual travel

    joystickWrap.addEventListener('touchstart', e => {
      e.preventDefault();
      if (this._joystickActive) return;
      const t = e.changedTouches[0];
      this._joystickActive  = true;
      this._joystickTouchId = t.identifier;
      this._joystickOriginX = t.clientX;
      this._lastLane        = 0;
      thumb.style.transform = 'translateX(0)';
    }, { passive: false });

    joystickWrap.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this._joystickActive) return;
      const t = [...e.changedTouches].find(c => c.identifier === this._joystickTouchId);
      if (!t) return;

      const dx      = t.clientX - this._joystickOriginX;
      const clamped = Math.max(-MAX_TRAVEL, Math.min(MAX_TRAVEL, dx));
      thumb.style.transform = `translateX(${clamped}px)`;

      const lane = dx > DEAD_ZONE ? 1 : dx < -DEAD_ZONE ? -1 : 0;
      if (lane !== this._lastLane) {
        if (lane === -1) this._input._emit('moveLeft');
        if (lane ===  1) this._input._emit('moveRight');
        this._lastLane = lane;
      }
    }, { passive: false });

    const endJoystick = e => {
      const t = [...e.changedTouches].find(c => c.identifier === this._joystickTouchId);
      if (!t) return;
      this._joystickActive  = false;
      this._joystickTouchId = null;
      this._lastLane        = 0;
      thumb.style.transform = 'translateX(0)';
    };
    joystickWrap.addEventListener('touchend',    endJoystick, { passive: true });
    joystickWrap.addEventListener('touchcancel', endJoystick, { passive: true });
  }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
