// vite.config.js
import { defineConfig } from 'vite';
import fsPersistPlugin from './vite-plugin-fs-persist.js';

export default defineConfig({
  plugins: [fsPersistPlugin()],
  server: {
    port: 5173,
    fs: { allow: ['vendor/three/editor', '.'] },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
});
