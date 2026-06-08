import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import { defineConfig, loadEnv } from 'vite';

function getCommitHash(): string {
  // Vercel expõe via process.env (System Environment Variables)
  const vercelSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA; // fallback para outros hosts

  if (vercelSha) {
    return vercelSha.slice(0, 7);
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

  // Log para confirmar no build log da Vercel
  console.log(`[vite.config] COMMIT_HASH = ${commitHash}`);
  console.log(`[vite.config] VERCEL_GIT_COMMIT_SHA = ${process.env.VERCEL_GIT_COMMIT_SHA ?? '(não definido)'}`);

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
