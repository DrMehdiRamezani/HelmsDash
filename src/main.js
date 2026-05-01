// src/main.js — Bootstrap: scene, renderer, game loop

import { Game }          from './core/Game.js';
import { HomePage }      from './ui/HomePage.js';
import { SaveManager }   from './core/SaveManager.js';
import { LoadingScreen } from './ui/LoadingScreen.js';

async function bootstrap() {
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);

  // Editor routes — boot before the game engine so nothing covers the UI
  if (params.get('editor') === 'formations') {
    const { FormationEditor } = await import('./editors/FormationEditor.js');
    new FormationEditor(app);
    return;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  app.appendChild(canvas);

  // Portal arrivals must load silently — no loading screen per Vibe Jam spec.
  const isPortalArrival = params.get('portal') === 'true';

  const loading = isPortalArrival ? null : new LoadingScreen();
  const game = new Game(canvas);
  if (import.meta.env.DEV) window._game = game;
  await game.init(loading ? (l, t) => loading.onProgress(l, t) : null);
  loading?.destroy();

  // Apply saved theme on boot
  const savedTheme = SaveManager.getTheme();
  if (savedTheme === 'pixel') game.sceneManager.setPixelArt(true);

  const applyTheme = (theme) => game.sceneManager.setPixelArt(theme === 'pixel');

  let homepage = null;

  function showHomePage() {
    homepage?.destroy();
    game.playHomeMusic();
    homepage = new HomePage((playerName) => {
      homepage = null;
      game.startFromMenu(playerName);
    }, applyTheme);
  }

  // Listen for game requesting menu
  window.addEventListener('helmsdash:showMenu', showHomePage);

  if (params.get('editor') === 'chunks') {
    const { ChunkLibraryEditor } = await import('./editors/ChunkLibraryEditor.js');
    new ChunkLibraryEditor(app, game.sceneManager.scene);
    return;
  }

  // If arriving from another Vibe Jam game via the portal, skip the home screen
  // and drop the player straight into the game with continuity.
  if (isPortalArrival) {
    const portalName = params.get('username') || SaveManager.getPlayerName() || 'Knight';
    const refUrl     = params.get('ref') || null;
    // Capture all original incoming params so the return portal can forward them back
    const incomingParams = Object.fromEntries(params.entries());
    SaveManager.setPlayerName(portalName);
    game.startFromMenu(portalName, { refUrl, incomingParams });
  } else {
    showHomePage();
  }
}

bootstrap().catch(console.error);
