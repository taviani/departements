#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const port = String(process.env.RCT_METRO_PORT || process.env.PORT || 8081);

execSync('node scripts/ensure-map-data.js', { stdio: 'inherit', cwd: projectRoot });

let lanIp = '127.0.0.1';
try {
  const { lanNetworkSync } = require('lan-network');
  lanIp = lanNetworkSync().address;
} catch {
  // localhost fallback for simulator-only
}

console.log('');
console.log('Expo Go — connexion sans QR code :');
console.log(`  • Simulateur iOS : appuyez sur i dans ce terminal`);
console.log(`  • iPhone (Expo Go) : saisissez exp://${lanIp}:${port}`);
console.log(`  • iPhone (Safari)  : http://${lanIp}:${port}/_expo/loading`);
console.log('Mac et iPhone sur le même Wi‑Fi. Expo Go SDK 54 requis.');
console.log('');

const child = spawn(
  'npx',
  ['expo', 'start', '--go', '--port', port],
  { stdio: 'inherit', cwd: projectRoot, env: process.env, shell: true }
);

child.on('exit', (code) => process.exit(code ?? 0));
