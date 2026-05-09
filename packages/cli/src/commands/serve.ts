import http from 'http';
import fs from 'fs/promises';
import path from 'path';

export async function serveCommand(options: { dir: string; port: number }) {
  const port = options.port || 3000;
  const dir = options.dir || './output';

  const server = http.createServer(async (req, res) => {
    let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url || '');
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const content = await fs.readFile(filePath);
      let contentType = 'text/html';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    }
  });

  server.listen(port, () => {
    console.log(`Serving ${dir} on http://localhost:${port}`);
  });
}
