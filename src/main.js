// src/main.js — Bootstrap: scene, renderer, game loop

import { Game }     from './core/Game.js';
import { HomePage } from './ui/HomePage.js';

async function bootstrap() {
  const app = document.getElementById('app');

  // Create canvas
  const canvas = document.createElement('canvas');
  app.appendChild(canvas);

  // Boot the game engine (doesn't start a session yet)
  const game = window._game = new Game(canvas);
  await game.init();

  let homepage = null;

  function showHomePage() {
    homepage?.destroy();
    homepage = new HomePage((playerName) => {
      homepage = null;
      game.startFromMenu(playerName);
    });
  }

  // Listen for game requesting menu
  window.addEventListener('helmsdash:showMenu', showHomePage);

  // Check for ChunkLibraryEditor mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('editor') === 'chunks') {
    // Load editor lazily
    const { ChunkLibraryEditor } = await import('./editors/ChunkLibraryEditor.js');
    new ChunkLibraryEditor(app, game.sceneManager.scene);
    return; // Don't show homepage in editor mode
  }

  // Show homepage on startup
  showHomePage();
}

bootstrap().catch(console.error);
