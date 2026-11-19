const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const toolkit = fs.realpathSync(path.join(__dirname, '..'));
const source = path.resolve(process.argv[2] || path.join(toolkit, '..', 'mirai-chat'));
const destination = path.join(toolkit, 'chat');

function run(command, env = process.env) {
    const result = spawnSync(command, { cwd: source, env, shell: true, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}

function validateBuild(directory) {
    if (!fs.lstatSync(directory).isDirectory() ||
        fs.readdirSync(directory).sort().join(',') !== 'LICENSE,index.html,static') {
        throw new Error(`Expected a generated chat build in ${directory}`);
    }

    const license = path.join(directory, 'LICENSE');
    const index = path.join(directory, 'index.html');
    const assets = path.join(directory, 'static');
    if (!fs.lstatSync(license).isFile() || !fs.readFileSync(license, 'utf8').startsWith('MIT License') ||
        !fs.lstatSync(index).isFile() || !fs.lstatSync(assets).isDirectory()) {
        throw new Error(`Expected index.html, the MIT license and static assets in ${directory}`);
    }
    for (const entry of fs.readdirSync(assets, { withFileTypes: true, recursive: true })) {
        if (!entry.isDirectory() && !(entry.isFile() && /\.(?:js|css|woff2?|ttf)$/.test(entry.name))) {
            throw new Error(`Unexpected chat asset: ${entry.name}`);
        }
    }
    const references = [...fs.readFileSync(index, 'utf8').matchAll(/\b(?:src|href)="([^"]+)"/g)];
    if (!references.length || references.some(([, reference]) =>
        !/^static\/[\w./-]+\.(?:css|js)$/.test(reference) ||
        reference.split('/').includes('..') || !fs.existsSync(path.join(directory, reference)))) {
        throw new Error('Chat HTML must reference existing relative assets under static/.');
    }
}

try {
    if (!fs.existsSync(path.join(source, 'rspack.config.ts')) ||
        !fs.existsSync(path.join(source, 'pnpm-lock.yaml'))) {
        throw new Error(`Expected a MiraiChat checkout in ${source}`);
    }
    if (fs.existsSync(destination)) validateBuild(destination);

    run('pnpm install --frozen-lockfile --prod=false');
    run('pnpm run build', { ...process.env, NODE_ENV: 'production' });
    const dist = path.join(source, 'dist');
    validateBuild(dist);

    const stage = fs.mkdtempSync(path.join(toolkit, '.chat-refresh-'));
    if (fs.realpathSync(stage) !== stage) throw new Error(`Unexpected staging path: ${stage}`);
    const next = path.join(stage, 'next');
    const previous = path.join(stage, 'previous');
    let preservePrevious = false;
    try {
        fs.cpSync(dist, next, { recursive: true });
        validateBuild(next);
        if (fs.existsSync(destination)) {
            validateBuild(destination);
            fs.renameSync(destination, previous);
            preservePrevious = true;
        }
        try {
            fs.renameSync(next, destination);
        } catch (error) {
            if (preservePrevious) fs.renameSync(previous, destination);
            preservePrevious = false;
            throw error;
        }
        preservePrevious = false;
    } finally {
        if (!preservePrevious) fs.rmSync(stage, { recursive: true, force: true });
    }

    console.log(`Updated ${destination} from ${source}`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
