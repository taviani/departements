const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mapFile = path.join(__dirname, '../data/departements-map.compressed.js');

if (!fs.existsSync(mapFile)) {
  console.log('Map data missing — generating overview map...');
  execSync('node scripts/build-map-data.js', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
}
