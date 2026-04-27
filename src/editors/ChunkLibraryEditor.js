// src/editors/ChunkLibraryEditor.js
// Lightweight panel: list chunks, set tags/weights, preview in mini-viewport,
// persist chunk_manifest.json via the fs-persist plugin.

import * as THREE from 'three';
import { persistToFile, loadFromFile } from '../core/persist.js';
import { generateProceduralChunk } from '../scene/TrackGenerator.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const EDITOR_CSS = `
  #cle-overlay {
    position: fixed; inset: 0; background: rgba(10,8,6,0.96);
    z-index: 200; display: flex; flex-direction: column;
    font-family: 'Cinzel', serif; color: #e8d5a0;
  }
  #cle-header {
    padding: 14px 20px; border-bottom: 1px solid rgba(245,200,66,0.25);
    font-size: 1.1rem; font-weight: 700; letter-spacing: 0.06em;
    color: #f5c842; display: flex; justify-content: space-between; align-items: center;
  }
  #cle-body {
    display: flex; flex: 1; overflow: hidden;
  }
  #cle-list {
    width: 240px; border-right: 1px solid rgba(255,255,255,0.08);
    overflow-y: auto; padding: 12px 0;
  }
  .cle-item {
    padding: 9px 18px; cursor: pointer; font-size: 0.82rem;
    border-left: 3px solid transparent; transition: background 0.1s;
  }
  .cle-item:hover { background: rgba(255,255,255,0.05); }
  .cle-item.active { background: rgba(245,200,66,0.1); border-left-color: #f5c842; color: #f5c842; }
  #cle-preview {
    flex: 1; position: relative; background: #0f0e0c;
  }
  #cle-preview canvas { width: 100% !important; height: 100% !important; }
  #cle-panel {
    width: 280px; border-left: 1px solid rgba(255,255,255,0.08);
    padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
  }
  .cle-field { display: flex; flex-direction: column; gap: 6px; }
  .cle-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: #a09070; }
  .cle-select, .cle-input {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(245,200,66,0.2);
    border-radius: 8px; padding: 8px 12px; color: #e8d5a0;
    font-family: 'Cinzel', serif; font-size: 0.85rem; outline: none;
    transition: border-color 0.15s;
  }
  .cle-select:focus, .cle-input:focus { border-color: #f5c842; }
  .cle-checkbox-row { display: flex; gap: 12px; align-items: center; font-size: 0.85rem; }
  .cle-checkbox-row input { width: 16px; height: 16px; accent-color: #f5c842; }
  .cle-save-btn {
    margin-top: 8px; padding: 11px; background: linear-gradient(135deg,#c8941a,#f5c842);
    border: none; border-radius: 10px; color: #1a0f03; font-family: 'Cinzel', serif;
    font-size: 0.9rem; font-weight: 900; cursor: pointer; letter-spacing: 0.05em;
    transition: transform 0.1s;
  }
  .cle-save-btn:hover { transform: translateY(-1px); }
  .cle-import-btn {
    padding: 9px; background: transparent; border: 1px solid rgba(245,200,66,0.3);
    border-radius: 10px; color: #a09070; font-family: 'Cinzel', serif;
    font-size: 0.8rem; cursor: pointer; transition: color 0.15s, border-color 0.15s;
  }
  .cle-import-btn:hover { color: #f5c842; border-color: #f5c842; }
  .cle-editor-btn {
    padding: 9px; background: transparent; border: 1px solid rgba(100,180,255,0.3);
    border-radius: 10px; color: #88bbdd; font-family: 'Cinzel', serif;
    font-size: 0.8rem; cursor: pointer; transition: color 0.15s, border-color 0.15s;
  }
  .cle-editor-btn:hover { color: #aaddff; border-color: #aaddff; }
  #cle-status {
    padding: 6px 12px; font-size: 0.75rem; color: #88cc88;
    border-top: 1px solid rgba(255,255,255,0.06); text-align: center;
  }
  .cle-range { width: 100%; accent-color: #f5c842; }
  .cle-range-val { font-size: 0.9rem; color: #f5c842; font-weight: 700; }
`;

export class ChunkLibraryEditor {
  constructor(container, _scene) {
    this._container = container;
    this._manifest  = [];
    this._selected  = null;

    // Mini preview renderer
    this._previewRenderer = null;
    this._previewScene    = new THREE.Scene();
    this._previewCamera   = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    this._previewCamera.position.set(0, 14, 20);
    this._previewCamera.lookAt(0, 0, -15);
    this._previewScene.background = new THREE.Color(0x0f0e0c);
    this._previewScene.add(new THREE.HemisphereLight(0xffe4b5, 0x8b6914, 0.8));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(-10, 20, 10);
    this._previewScene.add(sun);

    this._previewChunk = null;
    this._rafId = null;

    this._injectCSS();
    this._buildUI();
    this._loadManifest();
  }

  _injectCSS() {
    if (document.getElementById('cle-styles')) return;
    const style = document.createElement('style');
    style.id = 'cle-styles';
    style.textContent = EDITOR_CSS;
    document.head.appendChild(style);
  }

  _buildUI() {
    const overlay = document.createElement('div');
    overlay.id = 'cle-overlay';
    overlay.innerHTML = `
      <div id="cle-header">
        <span>🏰 HelmsDash — Chunk Library Editor</span>
        <a href="/" style="color:#a09070;font-size:0.8rem;text-decoration:none;">✕ Exit Editor</a>
      </div>
      <div id="cle-body">
        <div id="cle-list">
          <div style="padding:8px 18px 4px;font-size:0.7rem;color:#a09070;text-transform:uppercase;letter-spacing:0.1em;">Chunks</div>
        </div>
        <div id="cle-preview"></div>
        <div id="cle-panel">
          <div style="font-size:0.8rem;color:#a09070;text-align:center;margin-top:30px">Select a chunk to edit its tags</div>
        </div>
      </div>
      <div id="cle-status">Loading manifest…</div>
    `;
    this._container.appendChild(overlay);
    this._overlay = overlay;
    this._listEl   = overlay.querySelector('#cle-list');
    this._previewEl = overlay.querySelector('#cle-preview');
    this._panelEl  = overlay.querySelector('#cle-panel');
    this._statusEl = overlay.querySelector('#cle-status');

    // Setup preview renderer
    const canvas = document.createElement('canvas');
    this._previewEl.appendChild(canvas);
    this._previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this._previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const ro = new ResizeObserver(() => {
      const w = this._previewEl.clientWidth;
      const h = this._previewEl.clientHeight;
      this._previewRenderer.setSize(w, h);
      this._previewCamera.aspect = w / h;
      this._previewCamera.updateProjectionMatrix();
    });
    ro.observe(this._previewEl);

    this._rafId = requestAnimationFrame(t => this._previewLoop(t));
    this._previewT = 0;
  }

  _previewLoop(t) {
    this._rafId = requestAnimationFrame(ts => this._previewLoop(ts));
    const dt = Math.min((t - (this._lastT || t)) / 1000, 0.05);
    this._lastT = t;
    if (this._previewChunk) this._previewChunk.rotation.y += dt * 0.3;
    const w = this._previewEl.clientWidth;
    const h = this._previewEl.clientHeight;
    if (w > 0 && h > 0) this._previewRenderer.render(this._previewScene, this._previewCamera);
  }

  async _loadManifest() {
    const data = await loadFromFile('assets/data/chunk_manifest.json');
    this._manifest = data || [];
    this._rebuildList();
    this._setStatus(this._manifest.length > 0
      ? `Loaded ${this._manifest.length} chunk(s).`
      : 'No chunks yet. Import a JSON to get started.');
  }

  _rebuildList() {
    // Clear existing items
    const items = this._listEl.querySelectorAll('.cle-item');
    items.forEach(i => i.remove());

    for (const entry of this._manifest) {
      const item = document.createElement('div');
      item.className = 'cle-item' + (this._selected?.file === entry.file ? ' active' : '');
      item.textContent = entry.file;
      item.addEventListener('click', () => this._selectEntry(entry, item));
      this._listEl.appendChild(item);
    }

    // Import button
    if (!this._listEl.querySelector('.cle-import-btn')) {
      const importBtn = document.createElement('button');
      importBtn.className = 'cle-import-btn';
      importBtn.style.cssText = 'display:block;width:calc(100% - 36px);margin:12px 18px 0;';
      importBtn.textContent = '+ Import JSON';
      importBtn.addEventListener('click', () => this._importChunk());
      this._listEl.appendChild(importBtn);
    }
  }

  _selectEntry(entry, itemEl) {
    this._listEl.querySelectorAll('.cle-item').forEach(i => i.classList.remove('active'));
    itemEl.classList.add('active');
    this._selected = entry;
    this._buildPanel(entry);
    this._loadPreview(entry.file);
  }

  _buildPanel(entry) {
    const d = entry.difficulty || 'easy';
    const w = entry.spawnWeight ?? 1.0;
    const hasObs = entry.hasObstacle ?? true;
    const hasPwr = entry.hasPowerup ?? false;
    const notes  = entry.notes || '';

    this._panelEl.innerHTML = `
      <div style="font-size:0.9rem;font-weight:700;color:#f5c842;margin-bottom:4px;">${entry.file}</div>

      <div class="cle-field">
        <div class="cle-label">Difficulty</div>
        <select class="cle-select" id="cle-diff">
          ${DIFFICULTIES.map(d2 => `<option value="${d2}" ${d2===d?'selected':''}>${d2}</option>`).join('')}
        </select>
      </div>

      <div class="cle-field">
        <div class="cle-label">Spawn Weight <span class="cle-range-val" id="weight-val">${w.toFixed(1)}</span></div>
        <input type="range" class="cle-range" id="cle-weight" min="0" max="3" step="0.1" value="${w}" />
      </div>

      <div class="cle-field">
        <div class="cle-label">Flags</div>
        <div class="cle-checkbox-row">
          <input type="checkbox" id="cle-obs" ${hasObs?'checked':''} />
          <label for="cle-obs">Has Obstacle</label>
        </div>
        <div class="cle-checkbox-row">
          <input type="checkbox" id="cle-pwr" ${hasPwr?'checked':''} />
          <label for="cle-pwr">Has Power-up</label>
        </div>
      </div>

      <div class="cle-field">
        <div class="cle-label">Notes</div>
        <input class="cle-input" id="cle-notes" type="text" placeholder="Optional notes…" value="${notes}" />
      </div>

      <button class="cle-save-btn" id="cle-save-btn">💾 Save Manifest</button>
      <button class="cle-editor-btn" id="cle-open-editor">🔗 Open in Three.js Editor</button>
    `;

    this._panelEl.querySelector('#cle-weight').addEventListener('input', (e) => {
      this._panelEl.querySelector('#weight-val').textContent = parseFloat(e.target.value).toFixed(1);
    });

    this._panelEl.querySelector('#cle-save-btn').addEventListener('click', () => {
      this._applyEdits(entry);
      this._saveManifest();
    });

    this._panelEl.querySelector('#cle-open-editor').addEventListener('click', () => {
      const url = `/editor/index.html?chunk=${encodeURIComponent(entry.file)}`;
      window.open(url, '_blank');
    });
  }

  _applyEdits(entry) {
    entry.difficulty   = this._panelEl.querySelector('#cle-diff').value;
    entry.spawnWeight  = parseFloat(this._panelEl.querySelector('#cle-weight').value);
    entry.hasObstacle  = this._panelEl.querySelector('#cle-obs').checked;
    entry.hasPowerup   = this._panelEl.querySelector('#cle-pwr').checked;
    entry.notes        = this._panelEl.querySelector('#cle-notes').value;
  }

  async _saveManifest() {
    await persistToFile('assets/data/chunk_manifest.json', this._manifest);
    this._setStatus('✅ Manifest saved! HMR will reload the game.');
  }

  async _loadPreview(filename) {
    if (this._previewChunk) {
      this._previewScene.remove(this._previewChunk);
      this._previewChunk = null;
    }

    // Try loading the actual chunk JSON, fall back to procedural preview
    const { loadFromFile: lff } = await import('../core/persist.js');
    const json = await lff(`assets/chunks/${filename}`);
    if (json) {
      const loader = new THREE.ObjectLoader();
      const group = loader.parse(json);
      this._previewChunk = group;
    } else {
      // Generate a sample procedural chunk for preview
      const diff = filename.includes('easy') ? 'easy' : filename.includes('hard') ? 'hard' : 'medium';
      this._previewChunk = generateProceduralChunk(diff);
    }

    this._previewChunk.position.set(0, 0, 0);
    this._previewScene.add(this._previewChunk);
  }

  _importChunk() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      const filename = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

      // Write the chunk file to disk
      await persistToFile(`assets/chunks/${filename}`, data);

      // Add to manifest if not already there
      if (!this._manifest.find(m => m.file === filename)) {
        this._manifest.push({
          file: filename,
          difficulty: 'easy',
          spawnWeight: 1.0,
          hasObstacle: true,
          hasPowerup:  false,
          notes: '',
        });
      }

      await this._saveManifest();
      this._rebuildList();
      this._setStatus(`✅ Imported: ${filename}`);
    };
    input.click();
  }

  _setStatus(msg) {
    if (this._statusEl) this._statusEl.textContent = msg;
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._overlay?.remove();
    this._previewRenderer?.dispose();
  }
}
