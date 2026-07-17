import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');

  // Refresh build meta (root package version + git SHA + timestamp + env).
  execSync('node scripts/generate-build-meta.mjs', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
      APP_ENV:
        env.VITE_APP_ENV ||
        env.APP_ENV ||
        (mode === 'production' ? 'production' : 'development'),
      NODE_ENV: mode === 'production' ? 'production' : process.env.NODE_ENV || 'development',
    },
  });

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'offline.html',
          'favicon.svg',
          'icons/apple-touch-icon.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/maskable-icon-512.png',
        ],
        manifest: {
          name: 'Saki Operations',
          short_name: 'Saki Ops',
          description: 'Enterprise operations PWA by Saki Tours & Weddings (Pvt) Ltd',
          lang: 'en',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#0b1220',
          theme_color: '#0f172a',
          categories: ['business', 'productivity', 'utilities'],
          icons: [
            { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
            { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
            { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
            { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
            { src: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'saki-fonts',
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
    envDir: rootDir,
    envPrefix: 'VITE_',
  };
});
