const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mapFile = path.join(__dirname, '../data/departements-map.compressed.js');
const detailMapFile = path.join(__dirname, '../data/departements-map-detail.compressed.js');

if (!fs.existsSync(mapFile) || !fs.existsSync(detailMapFile)) {
  console.log('Map data missing — generating map compressed files...');
  execSync('node scripts/build-map-data.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}
