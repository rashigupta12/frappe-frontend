/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
            }
          }
        ]
      },
      // Fix: Remove duplicate and incorrect includeAssets
      includeAssets: ['logo.jpg', 'favicon.ico'],
      manifest: {
        "name": "EITS Services - Professional Home Solutions",
        "short_name": "EITS Services",
        "description": "Professional home improvement services including woodwork, painting, electrical, plumbing, and equipment maintenance.",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#10b981",
        "orientation": "portrait-primary",
        "scope": "/",
        "lang": "en",
        "categories": ["business", "utilities", "productivity"],
        "icons": [
          {
            "src": "/logo.jpg", // Fix: Use relative paths, not external URLs
            "sizes": "96x96",
            "type": "image/jpeg", // Fix: Correct MIME type for JPEG
            "purpose": "any"
          },
          {
            "src": "/logo.jpg",
            "sizes": "192x192", 
            "type": "image/jpeg",
            "purpose": "any maskable"
          },
          {
            "src": "/logo.jpg",
            "sizes": "512x512",
            "type": "image/jpeg", 
            "purpose": "any maskable"
          }
        ],
        "screenshots": [
          {
            "src": "/screenshot-mobile.png", // Use actual screenshots
            "sizes": "640x1136",
            "type": "image/png",
            "form_factor": "narrow"
          },
          {
            "src": "/screenshot-desktop.png", // Use actual screenshots
            "sizes": "1024x768", 
            "type": "image/png",
            "form_factor": "wide"
          }
        ],
        "shortcuts": [
          {
            "name": "Contact Us",
            "short_name": "Contact",
            "description": "Get in touch with EITS Services",
            "url": "/#contact",
            "icons": [
              {
                "src": "/logo.jpg",
                "sizes": "96x96",
                "type": "image/jpeg"
              }
            ]
          },
          {
            "name": "Our Services", 
            "short_name": "Services",
            "description": "View all our home improvement services",
            "url": "/#services",
            "icons": [
              {
                "src": "/logo.jpg",
                "sizes": "96x96",
                "type": "image/jpeg"
              }
            ]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    // Enable HTTPS for PWA testing on mobile devices
    // https: true, // Set to true for proper PWA testing
    // To enable HTTPS, provide key and cert files or use 'basic' for self-signed:
    // https: { key: fs.readFileSync('path/to/key.pem'), cert: fs.readFileSync('path/to/cert.pem') },
    // https: false, // Set to false or configure as needed
    proxy: {
      '/api': {
        target: 'https://eits.thebigocommunity.org',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 Proxy error:', err.message);
          });
          proxy.on('proxyReq', (req, _res) => {
            console.log('🔵 Sending Request:', req.method, req.path || '(no path)');
            const cookieHeader = req.getHeader && req.getHeader('cookie');
            if (cookieHeader) {
              console.log('🍪 Cookies:', cookieHeader);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🟢 Response:', proxyRes.statusCode, req.url);
            if (proxyRes.headers['set-cookie']) {
              console.log('🍪 Set-Cookie:', proxyRes.headers['set-cookie']);
            }
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    __FRAPPE_BASE_URL__: JSON.stringify('https://eits.thebigocommunity.org')
  }
})