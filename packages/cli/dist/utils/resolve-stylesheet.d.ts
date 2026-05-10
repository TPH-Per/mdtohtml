/**
 * Resolves the path to @llm-html-kit/stylesheet/dist/styles.css.
 * Tries several locations in order:
 *   1. Local node_modules (project-level install)
 *   2. Global node_modules (npm/pnpm global install)
 *   3. Monorepo sibling package (dev / pnpm workspace)
 */
export declare function resolveStylesheetPath(): Promise<string>;
