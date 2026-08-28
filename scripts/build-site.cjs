const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const exportDir = path.join(projectRoot, '.expo', 'export-site');
const distDir = path.join(projectRoot, 'dist');
const clientDir = path.join(distDir, 'client');
const serverDir = path.join(distDir, 'server');

fs.rmSync(exportDir, { recursive: true, force: true });
fs.rmSync(distDir, { recursive: true, force: true });

const expoCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(expoCommand, ['expo', 'export', '--platform', 'web', '--output-dir', exportDir], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

fs.mkdirSync(clientDir, { recursive: true });
fs.mkdirSync(serverDir, { recursive: true });
fs.cpSync(exportDir, clientDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'site-worker.mjs'), path.join(serverDir, 'index.js'));

console.log(`MomDaily site output ready at ${distDir}`);
