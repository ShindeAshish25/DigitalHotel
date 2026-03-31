import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // For all API calls (Orders, Auth, Tables)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // For Socket.io real-time updates
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    '/uploads': {  
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    },
  },
})