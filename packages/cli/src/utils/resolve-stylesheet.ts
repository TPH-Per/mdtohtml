import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

/**
 * Resolves the path to @llm-html-kit/stylesheet/dist/styles.css.
 * Tries several locations in order:
 *   1. Local node_modules (project-level install)
 *   2. Global node_modules (npm/pnpm global install)
 *   3. Monorepo sibling package (dev / pnpm workspace)
 */
export async function resolveStylesheetPath(): Promise<string> {
  const cwd = process.cwd();

  // 1. Local node_modules
  const localPaths = [
    path.join(cwd, 'node_modules/@llm-html-kit/stylesheet/dist/styles.css'),
    path.join(cwd, '../node_modules/@llm-html-kit/stylesheet/dist/styles.css'), // monorepo root node_modules
  ];

  for (const p of localPaths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }

  // 2. Global install — use require.resolve
  try {
    const _require = createRequire(import.meta.url);
    return _require.resolve('@llm-html-kit/stylesheet/dist/styles.css');
  } catch {}

  // 3. Monorepo workspace sibling (relative to this file)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const monorepoPath = path.resolve(__dirname, '../../../../stylesheet/dist/styles.css');
  
  try {
    await fs.access(monorepoPath);
    return monorepoPath;
  } catch {}

  throw new Error(
    'Cannot find @llm-html-kit/stylesheet/dist/styles.css.\n' +
    'Please ensure the package is installed and built.'
  );
}
