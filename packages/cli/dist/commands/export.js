import fs from 'fs/promises';
import path from 'path';
import { loadConfig } from '../utils/config-loader.js';
import chalk from 'chalk';
import ora from 'ora';
export async function exportCommand(file, options) {
    const spinner = ora(`Exporting ${file} to standalone HTML...`).start();
    try {
        const config = await loadConfig(options.config);
        const outputPath = options.output || file.replace('.html', '-standalone.html');
        const html = await fs.readFile(file, 'utf-8');
        // Resolve CSS path
        const linkMatch = html.match(/<link\s+rel="stylesheet"\s+href="([^"]+)"/i);
        let cssPath;
        if (linkMatch) {
            const cssHref = linkMatch[1];
            cssPath = path.resolve(path.dirname(file), cssHref);
        }
        else {
            cssPath = config.stylesheet
                ? path.resolve(process.cwd(), config.stylesheet)
                : path.resolve(__dirname, '../../../stylesheet/dist/styles.css');
        }
        let css = '';
        try {
            css = await fs.readFile(cssPath, 'utf-8');
        }
        catch (e) {
            spinner.warn(`Could not read linked stylesheet at ${cssPath}. Checking config/monorepo...`);
            cssPath = config.stylesheet
                ? path.resolve(process.cwd(), config.stylesheet)
                : path.resolve(__dirname, '../../../stylesheet/dist/styles.css');
            css = await fs.readFile(cssPath, 'utf-8');
        }
        // Replace the link tag with an inline style block
        const standaloneHtml = html.replace(/<link\s+rel="stylesheet"\s+href="[^"]*"/i, `<style>\n${css}\n</style>`);
        await fs.writeFile(outputPath, standaloneHtml);
        spinner.succeed(chalk.green(`Exported standalone HTML to ${chalk.bold(outputPath)}`));
    }
    catch (error) {
        spinner.fail(chalk.red(`Export failed: ${error.message}`));
        process.exit(1);
    }
}
