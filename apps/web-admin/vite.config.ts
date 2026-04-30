
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export default defineConfig(({ mode }) => {
  // Carrega as variáveis do .env
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5001'

  return {
    plugins: [react()],
    resolve: {
      // Força o Vite a usar apenas UMA instância do React (a da raiz)
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  }
})