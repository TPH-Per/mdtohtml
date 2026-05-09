import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';

const INJECT_SCRIPT = `
<script>
  const ws = new WebSocket('ws://' + location.host);
  ws.onmessage = (msg) => {
    if (msg.data === 'reload') window.location.reload();
  };
</script>
</body>
`;

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

      let content = await fs.readFile(filePath, 'utf-8');
      let contentType = 'text/html';
      
      if (filePath.endsWith('.css')) contentType = 'text/css';
      else if (filePath.endsWith('.js')) contentType = 'text/javascript';

      if (contentType === 'text/html') {
        content = content.replace('</body>', INJECT_SCRIPT);
      }

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

  const wss = new WebSocketServer({ server });
  
  const watcher = chokidar.watch(dir, {
    ignored: /(^|[\/\\])\../,
    persistent: true
  });

  watcher.on('change', path => {
    console.log(`File changed: ${path}`);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  });

  server.listen(port, () => {
    console.log(`Serving ${dir} on http://localhost:${port}`);
    console.log(`Watching for file changes...`);
  });
}
