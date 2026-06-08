import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import { defineConfig, loadEnv } from 'vite';

function getCommitHash(): string {
  // Vercel injeta automaticamente via System Environment Variables
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA;

  if (sha && sha.length >= 7) {
    return sha.slice(0, 7);
  }

  // Fallback local: lê do git
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const commitHash = getCommitHash();

  console.log(`[vite.config] COMMIT_HASH = ${commitHash}`);
  console.log(`[vite.config] VERCEL_GIT_COMMIT_SHA = ${process.env.VERCEL_GIT_COMMIT_SHA ?? '(não definido)'}`);

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // injeta como global substituível no bundle
      '__COMMIT_HASH__': JSON.stringify(commitHash),
      // também expõe via import.meta.env como fallback
      'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
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
