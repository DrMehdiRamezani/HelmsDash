// src/core/AudioManager.js
// Wraps Howler.js for all game audio

import { CONFIG } from '../config.js';

export class AudioManager {
  constructor() {
    this._muted = false;
    this._sounds = {};
    this._music = null;
    this._initialized = false;
  }

  async init() {
    // Dynamically import Howler (only loaded once)
    const { Howl, Howler } = await import('howler');
    this._Howl = Howl;
    this._Howler = Howler;
    Howler.volume(1.0);
    this._initialized = true;
  }

  _loadSound(key, src, options = {}) {
    if (!this._initialized) return null;
    if (this._sounds[key]) return this._sounds[key];

    this._sounds[key] = new this._Howl({
      src: Array.isArray(src) ? src : [src],
      loop: options.loop || false,
      volume: options.volume ?? CONFIG.SFX_VOLUME,
      preload: true,
      onloaderror: () => console.warn(`[Audio] Failed to load: ${src}`),
    });

    return this._sounds[key];
  }

  playMusic(key, src) {
    if (!this._initialized) return;
    if (this._music) {
      this._music.fade(this._music.volume(), 0, 500);
      setTimeout(() => { this._music?.stop(); }, 500);
    }
    const howl = new this._Howl({
      src: [src],
      loop: true,
      volume: 0,
      preload: true,
    });
    howl.play();
    howl.fade(0, CONFIG.MUSIC_VOLUME, 800);
    this._music = howl;
    this._sounds[key] = howl;
  }

  stopMusic(fadeMs = 1000) {
    if (!this._music) return;
    this._music.fade(this._music.volume(), 0, fadeMs);
    setTimeout(() => { this._music?.stop(); this._music = null; }, fadeMs);
  }

  play(key, src, options = {}) {
    if (!this._initialized || this._muted) return;
    const sound = this._loadSound(key, src, options);
    if (sound) sound.play();
  }

  playLoop(key, src, options = {}) {
    if (!this._initialized) return;
    const sound = this._loadSound(key, src, { ...options, loop: true });
    if (sound && !sound.playing()) sound.play();
  }

  stopLoop(key, fadeMs = 300) {
    const sound = this._sounds[key];
    if (!sound) return;
    if (fadeMs > 0) {
      sound.fade(sound.volume(), 0, fadeMs);
      setTimeout(() => sound.stop(), fadeMs);
    } else {
      sound.stop();
    }
  }

  setMuted(muted) {
    this._muted = muted;
    if (!this._initialized) return;
    this._Howler.mute(muted);
  }

  toggleMute() {
    this.setMuted(!this._muted);
    return this._muted;
  }

  isMuted() {
    return this._muted;
  }

  setPaused(paused) {
    if (!this._music) return;
    if (paused) {
      this._music.fade(this._music.volume(), 0.1, 300);
    } else {
      this._music.fade(this._music.volume(), CONFIG.MUSIC_VOLUME, 300);
    }
  }
}
