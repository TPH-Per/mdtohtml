import fs from 'fs/promises';
import path from 'path';

export async function exportCommand(file: string, options: { output: string }) {
  const outputPath = options.output || file.replace('.html', '-standalone.html');
  
  try {
    const html = await fs.readFile(file, 'utf-8');
    
    // Resolve CSS path
    const linkMatch = html.match(/<link\s+rel="stylesheet"\s+href="([^"]+)"/i);
    if (!linkMatch) {
      console.warn('⚠ No <link rel="stylesheet"> found. Exporting as-is.');
      await fs.writeFile(outputPath, html);
      return;
    }
    const cssHref = linkMatch[1];
    
    let cssPath = path.resolve(path.dirname(file), cssHref);
    let css = '';
    
    try {
      css = await fs.readFile(cssPath, 'utf-8');
    } catch (e) {
       // fallback
       cssPath = path.resolve(__dirname, '../../../stylesheet/dist/styles.css');
       try {
         css = await fs.readFile(cssPath, 'utf-8');
       } catch (fallbackErr) {
         throw new Error(`Could not read stylesheet at ${cssPath}`);
       }
    }

    // Replace the link tag with an inline style block
    const standaloneHtml = html.replace(
      /<link\s+rel="stylesheet"\s+href="[^"]*"/i,
      `<style>\n${css}\n</style>`
    );

    await fs.writeFile(outputPath, standaloneHtml);
    console.log(`Exported standalone HTML to ${outputPath}`);
  } catch (error: any) {
    console.error(`Export failed: ${error.message}`);
    process.exit(1);
  }
}
