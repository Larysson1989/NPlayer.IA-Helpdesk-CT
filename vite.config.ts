import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';

const require = createRequire(import.meta.url);

function getCommitHash(): string {
  try {
    const { hash } = require('./src/commit-hash.json');
    return hash || 'dev';
  } catch {
    return 'dev';
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const commitHash = getCommitHash();

  console.log(`[vite.config] COMMIT_HASH = ${commitHash}`);

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
    optimizeDeps: {
      include: ['emoji-picker-react'],
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
