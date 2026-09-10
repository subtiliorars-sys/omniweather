import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [cesium()],
  root: '.',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, open: false },
});
