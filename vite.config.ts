import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon-32x32.png',
          'favicon-16x16.png',
          'apple-touch-icon.png',
          'icon.svg',
          'shortcut-new.png',
          'shortcut-schedule.png',
          'shortcut-calc.png',
        ],
        manifest: {
          id: '/',
          name: 'SRIRAM FARMS – Planting & Seeding Manager',
          short_name: 'SriramFarms',
          description: 'Agricultural machinery management web application for SRIRAM FARMS to register farmers, track seeding & planting schedules, machinery billing, employee wages, offline persistence, and PDF reports.',
          theme_color: '#15803d',
          background_color: '#f5f5f4',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: "New Farmer Booking",
              short_name: "New Booking",
              description: "Quickly register a new farmer and machinery booking",
              url: "/?action=new",
              icons: [{ src: "/shortcut-new.png", sizes: "96x96", type: "image/png" }],
            },
            {
              name: "Today's Schedule",
              short_name: "Schedule",
              description: "View today's seeding and planting schedules",
              url: "/?tab=schedule",
              icons: [{ src: "/shortcut-schedule.png", sizes: "96x96", type: "image/png" }],
            },
            {
              name: "Machinery Calculator",
              short_name: "Calculator",
              description: "Calculate acres, cents and machinery charges",
              url: "/?action=calculator",
              icons: [{ src: "/shortcut-calc.png", sizes: "96x96", type: "image/png" }],
            },
            {
              name: "Customer Records",
              short_name: "Customers",
              description: "Browse registered farmers, acreage and payments",
              url: "/?tab=customers",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
            {
              name: "Employee Wages",
              short_name: "Employees",
              description: "Manage employee work logs and wages",
              url: "/?tab=employees",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
