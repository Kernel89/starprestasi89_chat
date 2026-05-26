import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const projectRoot = __dirname;
  return {
    root: projectRoot,
    logLevel: 'info',
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
      proxy: {
        '/api': {
          target: 'https://konselingsmandak.info',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {},
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': projectRoot,
      }
    }
  };
});
