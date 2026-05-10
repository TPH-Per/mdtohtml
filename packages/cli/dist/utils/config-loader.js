import { createJiti } from 'jiti';
import path from 'path';
import fs from 'fs/promises';
export async function loadConfig(configPath) {
    const cwd = process.cwd();
    const searchPaths = configPath
        ? [path.resolve(cwd, configPath)]
        : [
            path.join(cwd, 'llm-html.config.ts'),
            path.join(cwd, 'llm-html.config.js'),
            path.join(cwd, 'llm-html.config.mjs'),
        ];
    const jiti = createJiti(import.meta.url);
    for (const p of searchPaths) {
        try {
            await fs.access(p);
            const mod = await jiti.import(p);
            return mod.default || mod;
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                console.warn(`⚠ Failed to load config at ${p}: ${e.message}`);
            }
        }
    }
    return {};
}
