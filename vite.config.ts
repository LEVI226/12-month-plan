import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['node:sqlite', /^node:/],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/preparation.ts'],
    environmentMatchGlobs: [
      ['tests/donnees/**', 'node'],
    ],
  },
});
