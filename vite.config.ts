/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy API calls to avoid CORS issues during development
      '/api': {
        target: 'https://eits.thebigocommunity.org',
        changeOrigin: true,
        secure: true,
        // Preserve cookies for authentication
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        // Additional headers for better compatibility
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Enable detailed logging for debugging
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 Proxy error:', err.message);
          });
          proxy.on('proxyReq', ( req, _res) => {
            console.log('🔵 Sending Request:', req.method, req.path || '(no path)');
            // Log headers for debugging authentication issues
            const cookieHeader = req.getHeader && req.getHeader('cookie');
            if (cookieHeader) {
              console.log('🍪 Cookies:', cookieHeader);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🟢 Response:', proxyRes.statusCode, req.url);
            // Log Set-Cookie headers
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
    // Define global constants
    __FRAPPE_BASE_URL__: JSON.stringify('https://eits.thebigocommunity.org')
  }
})
