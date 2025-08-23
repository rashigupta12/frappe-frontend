/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Determine if we're in development mode
  const isDev = mode === 'development'

  // Get the API base URL from environment variables
  const apiBaseUrl = env.VITE_API_BASE_URL || (isDev ? 'http://eits.local:8000/' : '')


  return {
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
        includeAssets: ['favicon.ico',
          'favicon-16x16.png',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'logo.jpg'],
        manifest: {
          "name": "EITS",
          "short_name": "EITS",
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
        "src": "/favicon.ico",
        "sizes": "16x16 32x32",
        "type": "image/x-icon",
        "purpose": "favicon"
      },
      {
        "src": "/favicon-16x16.png",
        "sizes": "16x16",
        "type": "image/png",
        "purpose": "favicon"
      },
      {
        "src": "/favicon-32x32.png",
        "sizes": "32x32",
        "type": "image/png",
        "purpose": "favicon"
      },
      // PWA icons
      {
        "src": "/logo.jpg",
        "sizes": "96x96",
        "type": "image/jpeg",
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
        "sizes": "256x256", 
        "type": "image/jpeg",
        "purpose": "any maskable"
      },
      {
        "src": "/logo.jpg",
        "sizes": "512x512",
        "type": "image/jpeg", 
        "purpose": "any maskable"
      },
      // Apple touch icon
      {
        "src": "/apple-touch-icon.png",
        "sizes": "180x180",
        "type": "image/png",
        "purpose": "any"
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
      proxy: isDev ? {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false, // Set to false for local development
          cookieDomainRewrite: {
            '*': 'localhost'
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('🔴 Proxy error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔵 Sending Request:', req.method, req.url);

              // Add CORS headers for local development
              proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
              proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');

              // Only add JSON headers for non-multipart requests
              const contentType = req.headers['content-type'];
              if (!contentType || !contentType.includes('multipart/form-data')) {
                // Only set JSON headers for regular API calls
                if (!proxyReq.getHeader('content-type')) {
                  proxyReq.setHeader('content-type', 'application/json');
                }
                if (!proxyReq.getHeader('accept')) {
                  proxyReq.setHeader('accept', 'application/json');
                }
              } else {
                console.log('🎯 Multipart request detected - preserving original headers');
              }

              const cookieHeader = req.headers.cookie;
              if (cookieHeader) {
                console.log('🍪 Cookies:', cookieHeader);
              }
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('🟢 Response:', proxyRes.statusCode, req.url);

              // Add CORS headers to response
              proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';

              if (proxyRes.headers['set-cookie']) {
                console.log('🍪 Set-Cookie:', proxyRes.headers['set-cookie']);
              }
            });
          },
        }
      } : undefined
    },
    preview: {
      port: 4173,
      host: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: {
            '*': 'localhost'
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('🔴 Proxy error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔵 Sending Request:', req.method, req.url);

              // Only add JSON headers for non-multipart requests
              const contentType = req.headers['content-type'];
              if (!contentType || !contentType.includes('multipart/form-data')) {
                // Only set JSON headers for regular API calls
                if (!proxyReq.getHeader('content-type')) {
                  proxyReq.setHeader('content-type', 'application/json');
                }
                if (!proxyReq.getHeader('accept')) {
                  proxyReq.setHeader('accept', 'application/json');
                }
              } else {
                console.log('🎯 Multipart request detected - preserving original headers');
              }

              const cookieHeader = req.headers.cookie;
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
      // Ensure proper chunking for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            axios: ['axios']
          }
        }
      }
    },
    define: {
      __FRAPPE_BASE_URL__: JSON.stringify(apiBaseUrl)
    }
  }
})