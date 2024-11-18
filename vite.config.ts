import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: ['src/popup.html', 'src/options.html'],
    },
    outDir: 'dist',
  },
  plugins: [],
});
