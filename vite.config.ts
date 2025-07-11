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
            "sizes": "512x512",
            "type": "image/jpeg", 
            "purpose": "any maskable"
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
    proxy: {
      '/api': {
        target: 'https://eits.thebigocommunity.org',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        // REMOVED: Don't set default headers for all requests
        // This was causing the JSONDecodeError for file uploads
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
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://eits.thebigocommunity.org',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        // REMOVED: Don't set default headers for all requests
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
    __FRAPPE_BASE_URL__: JSON.stringify('https://eits.thebigocommunity.org')
  }
})




// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { defineConfig, loadEnv } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from "@tailwindcss/vite"
// import path from "path"
// import { VitePWA } from 'vite-plugin-pwa'

// // https://vite.dev/config/
// export default defineConfig(({ mode }) => {
//   // Load env file based on `mode` in the current working directory
//   const env = loadEnv(mode, process.cwd(), 'VITE_')
  
//   // Determine the API base URL based on the environment
//   const apiBaseUrl = env.VITE_API_BASE_URL
//   const isProduction = mode === 'production'
  
//   return {
//     plugins: [
//       react(), 
//       tailwindcss(),
//       VitePWA({
//         registerType: 'autoUpdate',
//         workbox: {
//           globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
//           runtimeCaching: [
//             {
//               urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
//               handler: 'CacheFirst',
//               options: {
//                 cacheName: 'google-fonts-cache',
//                 expiration: {
//                   maxEntries: 10,
//                   maxAgeSeconds: 60 * 60 * 24 * 365
//                 },
//               }
//             }
//           ]
//         },
//         includeAssets: ['logo.jpg', 'favicon.ico'],
//         manifest: {
//           "name": "EITS Services - Professional Home Solutions",
//           "short_name": "EITS Services",
//           "description": "Professional home improvement services including woodwork, painting, electrical, plumbing, and equipment maintenance.",
//           "start_url": "/",
//           "display": "standalone",
//           "background_color": "#ffffff",
//           "theme_color": "#10b981",
//           "orientation": "portrait-primary",
//           "scope": "/",
//           "lang": "en",
//           "categories": ["business", "utilities", "productivity"],
//           "icons": [
//             {
//               "src": "/logo.jpg",
//               "sizes": "96x96",
//               "type": "image/jpeg",
//               "purpose": "any"
//             },
//             {
//               "src": "/logo.jpg",
//               "sizes": "192x192", 
//               "type": "image/jpeg",
//               "purpose": "any maskable"
//             },
//             {
//               "src": "/logo.jpg",
//               "sizes": "512x512",
//               "type": "image/jpeg", 
//               "purpose": "any maskable"
//             }
//           ],
//           "shortcuts": [
//             {
//               "name": "Contact Us",
//               "short_name": "Contact",
//               "description": "Get in touch with EITS Services",
//               "url": "/#contact",
//               "icons": [
//                 {
//                   "src": "/logo.jpg",
//                   "sizes": "96x96",
//                   "type": "image/jpeg"
//                 }
//               ]
//             },
//             {
//               "name": "Our Services", 
//               "short_name": "Services",
//               "description": "View all our home improvement services",
//               "url": "/#services",
//               "icons": [
//                 {
//                   "src": "/logo.jpg",
//                   "sizes": "96x96",
//                   "type": "image/jpeg"
//                 }
//               ]
//             }
//           ]
//         },
//         devOptions: {
//           enabled: true,
//           type: 'module'
//         }
//       })
//     ],
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//     server: {
//       port: 3000,
//       host: true,
//       proxy: {
//         '/api': {
//           target: apiBaseUrl,
//           changeOrigin: true,
//           secure: isProduction,
//           cookieDomainRewrite: {
//             '*': 'localhost'
//           },
//           configure: (proxy, _options) => {
//             proxy.on('error', (err, _req, _res) => {
//               console.log('🔴 Proxy error:', err.message);
//             });
//             proxy.on('proxyReq', (proxyReq, req, _res) => {
//               console.log('🔵 Sending Request:', req.method, req.url);
              
//               const contentType = req.headers['content-type'];
//               if (!contentType || !contentType.includes('multipart/form-data')) {
//                 if (!proxyReq.getHeader('content-type')) {
//                   proxyReq.setHeader('content-type', 'application/json');
//                 }
//                 if (!proxyReq.getHeader('accept')) {
//                   proxyReq.setHeader('accept', 'application/json');
//                 }
//               } else {
//                 console.log('🎯 Multipart request detected - preserving original headers');
//               }
              
//               const cookieHeader = req.headers.cookie;
//               if (cookieHeader) {
//                 console.log('🍪 Cookies:', cookieHeader);
//               }
//             });
//             proxy.on('proxyRes', (proxyRes, req, _res) => {
//               console.log('🟢 Response:', proxyRes.statusCode, req.url);
//               if (proxyRes.headers['set-cookie']) {
//                 console.log('🍪 Set-Cookie:', proxyRes.headers['set-cookie']);
//               }
//             });
//           },
//         }
//       }
//     },
//     preview: {
//       port: 4173,
//       host: true,
//       proxy: {
//         '/api': {
//           target: apiBaseUrl,
//           changeOrigin: true,
//           secure: isProduction,
//           cookieDomainRewrite: {
//             '*': 'localhost'
//           },
//           configure: (proxy, _options) => {
//             proxy.on('error', (err, _req, _res) => {
//               console.log('🔴 Proxy error:', err.message);
//             });
//             proxy.on('proxyReq', (proxyReq, req, _res) => {
//               console.log('🔵 Sending Request:', req.method, req.url);
              
//               const contentType = req.headers['content-type'];
//               if (!contentType || !contentType.includes('multipart/form-data')) {
//                 if (!proxyReq.getHeader('content-type')) {
//                   proxyReq.setHeader('content-type', 'application/json');
//                 }
//                 if (!proxyReq.getHeader('accept')) {
//                   proxyReq.setHeader('accept', 'application/json');
//                 }
//               } else {
//                 console.log('🎯 Multipart request detected - preserving original headers');
//               }
              
//               const cookieHeader = req.headers.cookie;
//               if (cookieHeader) {
//                 console.log('🍪 Cookies:', cookieHeader);
//               }
//             });
//             proxy.on('proxyRes', (proxyRes, req, _res) => {
//               console.log('🟢 Response:', proxyRes.statusCode, req.url);
//               if (proxyRes.headers['set-cookie']) {
//                 console.log('🍪 Set-Cookie:', proxyRes.headers['set-cookie']);
//               }
//             });
//           },
//         }
//       }
//     },
//     build: {
//       outDir: 'dist',
//       sourcemap: true,
//       rollupOptions: {
//         output: {
//           manualChunks: {
//             vendor: ['react', 'react-dom'],
//             axios: ['axios']
//           }
//         }
//       }
//     },
//     define: {
//       // Use environment variables in your app
//       'process.env': {
//         VITE_API_BASE_URL: JSON.stringify(apiBaseUrl),
//         VITE_APP_ENV: JSON.stringify(env.VITE_APP_ENV),
//         IMAGEURL: JSON.stringify('https://eits.thebigocommunity.org')
//       },
//       __FRAPPE_BASE_URL__: JSON.stringify('https://eits.thebigocommunity.org')
//     }
//   }
// })