import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@containers': '/src/containers',
      '@pages': '/src/pages',
      '@static': '/src/static',
      '@store': '/src/store',
      '@web3': '/src/web3',
      '@utils': '/src/utils',
      '@/': '/src'
    }
  },
  server: {
    host: 'localhost',
    port: 3000
  }
})
