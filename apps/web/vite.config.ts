import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasmPlugin from 'vite-plugin-wasm'

const wasm = typeof wasmPlugin === 'function' ? wasmPlugin : ((wasmPlugin as unknown as { default: () => PluginOption }).default)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
  ],
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['libsodium-wrappers-sumo'],
  },
  build: {
    target: 'es2022',
  },
})
