import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import { loadConfig } from '../utils/config-loader.js';
import chalk from 'chalk';
const INJECT_SCRIPT = `
<script>
  const ws = new WebSocket('ws://' + location.host);
  ws.onmessage = (msg) => {
    if (msg.data === 'reload') window.location.reload();
  };
</script>
</body>
`;
export async function serveCommand(options) {
    const config = await loadConfig(options.config);
    const port = options.port || 3000;
    const dir = options.dir || config.outputDir || './output';
    const server = http.createServer(async (req, res) => {
        let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url || '');
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
            let content = await fs.readFile(filePath, 'utf-8');
            let contentType = 'text/html';
            if (filePath.endsWith('.css'))
                contentType = 'text/css';
            else if (filePath.endsWith('.js'))
                contentType = 'text/javascript';
            if (contentType === 'text/html') {
                content = content.replace('</body>', INJECT_SCRIPT);
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            }
            else {
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
    watcher.on('change', filePath => {
        console.log(`${chalk.gray('[serve]')} File changed: ${chalk.cyan(path.relative(dir, filePath))}`);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
    });
    server.listen(port, () => {
        console.log(chalk.bold(`\nllm-html serve`));
        console.log(`  ${chalk.cyan('➜')}  Local:   ${chalk.bold(`http://localhost:${port}`)}`);
        console.log(`  ${chalk.cyan('➜')}  Serving: ${chalk.bold(dir)}`);
        console.log(`  ${chalk.gray('Watching for file changes...')}\n`);
    });
}
