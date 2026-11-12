import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devAssets } from './dev-assets.ts';
export default defineConfig({
  plugins: [react(), devAssets()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: { manualChunks: (id) => (id.includes('/node_modules/three/') ? 'three' : undefined) },
    },
  },
});
