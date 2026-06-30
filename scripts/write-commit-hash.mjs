import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const sha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  (() => {
    try {
      return execSync('git rev-parse HEAD', { stdio: ['pipe', 'pipe', 'pipe'] })
        .toString()
        .trim();
    } catch {
      return 'dev';
    }
  })();

const hash = sha !== 'dev' ? sha.slice(0, 7) : 'dev';

writeFileSync(
  'src/commit-hash.json',
  JSON.stringify({ hash }),
  'utf-8'
);

console.log(`[prebuild] commit hash gravado: ${hash}`);
