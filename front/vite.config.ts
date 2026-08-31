import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Doit rester aligné sur `paths` dans tsconfig.json, sinon TS résout et Vite non.
  // `import.meta.dirname` et non `__dirname` : la config est un module ESM.
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    // Le front appelle /api en relatif : le proxy évite toute config CORS en dev
    // et le comportement reste identique derrière le reverse proxy du VPS.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
