#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const port = String(process.env.RCT_METRO_PORT || process.env.PORT || 8081);
const forSimulator =
  process.argv.includes('--simulator') || process.env.EXPO_DEV_SIMULATOR === '1';

execSync('node scripts/ensure-map-data.js', { stdio: 'inherit', cwd: projectRoot });

let host = '127.0.0.1';

if (!forSimulator) {
  try {
    const { lanNetworkSync } = require('lan-network');
    host = lanNetworkSync().address;
  } catch {
    console.warn('Could not detect LAN IP — using 127.0.0.1');
  }
}

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = forSimulator ? 'localhost' : host;
process.env.EXPO_DEV_SERVER_ORIGIN = `http://${forSimulator ? 'localhost' : host}:${port}`;

console.log('');
if (forSimulator) {
  console.log(`Simulator URL: http://localhost:${port}`);
} else {
  console.log(`iPhone URL: http://${host}:${port}`);
  console.log('Mac and iPhone must be on the same Wi-Fi.');
  console.log('If the phone shows a LAN error, see DEPLOY-IPHONE.md → Troubleshooting.');
}
console.log('');

const expoArgs = [
  'expo',
  'start',
  '--dev-client',
  '--port',
  port,
  forSimulator ? '--localhost' : '--host',
  ...(forSimulator ? [] : ['lan']),
];

const child = spawn('npx', expoArgs, {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
