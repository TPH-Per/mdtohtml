import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

/**
 * Resolves the path to @llm-html-kit/stylesheet/dist/styles.css.
 * Tries three locations in order:
 *   1. Local node_modules (project-level install)
 *   2. Global node_modules (npm/pnpm global install)
 *   3. Monorepo sibling package (dev / pnpm workspace)
 */
export async function resolveStylesheetPath(): Promise<string> {
  // 1. Local node_modules
  const localPath = path.resolve(
    process.cwd(),
    'node_modules/@llm-html-kit/stylesheet/dist/styles.css'
  );
  try {
    await fs.access(localPath);
    return localPath;
  } catch {}

  // 2. Global install — use createRequire for ESM/CJS compat
  try {
    const _require = createRequire(
      typeof __filename !== 'undefined'
        ? __filename
        : fileURLToPath(import.meta.url)
    );
    return _require.resolve('@llm-html-kit/stylesheet/dist/styles.css');
  } catch {}

  // 3. Monorepo workspace sibling (dev environment)
  const monorepoPath = path.resolve(
    typeof __dirname !== 'undefined'
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url)),
    '../../../../stylesheet/dist/styles.css'
  );
  try {
    await fs.access(monorepoPath);
    return monorepoPath;
  } catch {}

  throw new Error(
    'Cannot find @llm-html-kit/stylesheet/dist/styles.css.\n' +
    'Run: pnpm turbo build   (in monorepo)\n' +
    '  or: npm install -g llm-html-kit   (global install)'
  );
}
