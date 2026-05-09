import fs from 'fs/promises';
import path from 'path';

export async function exportCommand(file: string, options: { output: string }) {
  const outputPath = options.output || file.replace('.html', '-standalone.html');
  
  try {
    const html = await fs.readFile(file, 'utf-8');
    
    // In a real implementation we would dynamically load the stylesheet path from config
    const cssPath = path.resolve(__dirname, '../../../stylesheet/dist/styles.css');
    const css = await fs.readFile(cssPath, 'utf-8');

    // Replace the link tag with an inline style block
    const standaloneHtml = html.replace(
      /<link rel="stylesheet" href="[^"]*styles\.css">/,
      `<style>\n${css}\n</style>`
    );

    await fs.writeFile(outputPath, standaloneHtml);
    console.log(`Exported standalone HTML to ${outputPath}`);
  } catch (error: any) {
    console.error(`Export failed: ${error.message}`);
    process.exit(1);
  }
}
