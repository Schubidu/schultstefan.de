import { defineConfig } from 'vite';

const legacyEntry = '/_dist_/index.js';
const sourceEntry = new URL('./src/index.ts', import.meta.url).pathname;

export default defineConfig({
  plugins: [
    {
      name: 'legacy-entry',
      enforce: 'pre',
      resolveId(source) {
        return source === legacyEntry ? sourceEntry : null;
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
