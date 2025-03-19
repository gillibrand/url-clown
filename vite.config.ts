import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: ['src/popup.html', 'src/options.html'],
    },
    outDir: 'dist',
  },
  plugins: [],
});
