/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: '/',
    src: '/_dist_',
  },
  plugins: ['@snowpack/plugin-typescript'],
  routes: [
    /* Enable an SPA Fallback in development: */
    { match: 'routes', src: '.*', dest: '/index.html' },
  ],
  optimize: {
    /* Example: Bundle your final build: */
    bundle: true,
    splitting: true,
    manifest: false,
    treeshake: true,
    minify: true,
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    output: 'stream',
    open: 'none',
    /* ... */
  },
  buildOptions: {
    clean: true,
    out: 'dist',
    /* ... */
  },
};
