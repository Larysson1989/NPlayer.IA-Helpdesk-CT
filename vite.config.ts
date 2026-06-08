import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import {defineConfig, loadEnv} from 'vite';

function getCommitHash(): string {
  // 1. Vercel injeta esta variavel de sistema durante o build
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  // 2. Fallback: pega do git local
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const commitHash = getCommitHash();
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__COMMIT_HASH__': JSON.stringify(commitHash),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom'],
            'vendor-motion':   ['motion/react'],
            'vendor-markdown': ['react-markdown'],
            'vendor-gemini':   ['@google/genai'],
          },
        },
      },
    },
  };
});
