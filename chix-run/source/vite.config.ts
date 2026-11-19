import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  plugins: [{
    name: 'standalone-gallery-link',
    apply: 'serve',
    transformIndexHtml(html) {
      // The standalone dev server has no gallery. The full site uses its own /play.
      return html.replaceAll('href="/play#chix-run"', 'href="https://williswee.com/play#chix-run"');
    },
  }],
});
