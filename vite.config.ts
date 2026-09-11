import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'legacy-entry',
      enforce: 'pre',
      transformIndexHtml(html) {
        return html.replace('/_dist_/index.js', '/src/index.ts');
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
