#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const port = String(process.env.RCT_METRO_PORT || process.env.PORT || 8081);

execSync('node scripts/ensure-map-data.js', { stdio: 'inherit', cwd: projectRoot });

console.log('');
console.log('Expo Go — scan the QR code with your iPhone, or press i (simulator) / w (web).');
console.log('Install Expo Go from the App Store if needed (SDK 54).');
console.log('');

const child = spawn(
  'npx',
  ['expo', 'start', '--go', '--port', port],
  { stdio: 'inherit', cwd: projectRoot, env: process.env, shell: true }
);

child.on('exit', (code) => process.exit(code ?? 0));
