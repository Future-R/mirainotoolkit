const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const host = '127.0.0.1';
const port = Number(process.env.PORT || process.argv[2] || 8080);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

const send = (res, statusCode, headers, body) => {
    res.writeHead(statusCode, headers);
    res.end(body);
};

const resolvePath = (requestUrl) => {
    const [pathname] = (requestUrl || '/').split('?');
    const decodedPath = decodeURIComponent(pathname);
    const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
    return path.join(rootDir, safePath);
};

const server = http.createServer((req, res) => {
    let targetPath = resolvePath(req.url);

    fs.stat(targetPath, (statError, stats) => {
        if (statError) {
            send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not Found');
            return;
        }

        if (stats.isDirectory()) {
            targetPath = path.join(targetPath, 'index.html');
        }

        fs.readFile(targetPath, (readError, data) => {
            if (readError) {
                const statusCode = readError.code === 'ENOENT' ? 404 : 500;
                const message = statusCode === 404 ? 'Not Found' : 'Internal Server Error';
                send(res, statusCode, { 'Content-Type': 'text/plain; charset=utf-8' }, message);
                return;
            }

            const ext = path.extname(targetPath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            send(res, 200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store'
            }, data);
        });
    });
});

server.listen(port, host, () => {
    console.log(`Local server running at http://${host}:${port}/`);
    console.log(`Open http://localhost:${port}/ in your browser if you prefer.`);
});

server.on('error', (error) => {
    console.error(error);
    process.exit(1);
});
