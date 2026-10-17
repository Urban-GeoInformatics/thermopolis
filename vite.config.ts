import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Strict Content-Security-Policy as a <meta> tag, added to PRODUCTION builds only
 * (the dev server needs inline scripts for hot reload). A meta tag works on every
 * static host, including GitHub Pages, which cannot set HTTP headers.
 * The app loads nothing from other origins, so nothing else needs to be allowed.
 */
const csp = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const cspPlugin = (): Plugin => ({
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' }],
});

// base './' makes the build work from any sub-path (GitHub Pages project sites,
// Vercel, a USB stick via any static server) without configuration.
export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
  build: { target: 'es2020', sourcemap: false },
});
