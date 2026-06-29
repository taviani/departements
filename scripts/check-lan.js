#!/usr/bin/env node
const http = require('http');
const { execSync } = require('child_process');

const port = Number(process.env.RCT_METRO_PORT || process.env.PORT || 8081);

let lanIp = null;
try {
  const { lanNetworkSync } = require('lan-network');
  lanIp = lanNetworkSync().address;
} catch {
  console.error('Could not detect LAN IP.');
  process.exit(1);
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/status`, { timeout: 3000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, body }));
    });
    req.on('error', (error) => resolve({ ok: false, error: error.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
  });
}

async function main() {
  console.log(`LAN IP: ${lanIp}`);
  console.log(`Metro port: ${port}`);
  console.log('');

  const localhost = await probe(`http://127.0.0.1:${port}`);
  const lan = await probe(`http://${lanIp}:${port}`);

  console.log(`127.0.0.1:${port}/status → ${localhost.ok ? 'OK' : localhost.error || localhost.status}`);
  console.log(`${lanIp}:${port}/status → ${lan.ok ? 'OK' : lan.error || lan.status}`);

  let firewallEnabled = false;
  try {
    const state = execSync('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate', {
      encoding: 'utf8',
    });
    firewallEnabled = state.includes('enabled');
    console.log(`macOS firewall: ${firewallEnabled ? 'ON' : 'off'}`);
  } catch {
    console.log('macOS firewall: unknown');
  }

  console.log('');
  if (!localhost.ok) {
    console.log('Metro is not running. Start it with: npm run dev');
    process.exit(1);
  }

  if (!lan.ok) {
    console.log('LAN probe failed from this Mac.');
    if (firewallEnabled) {
      console.log('Your firewall is ON — this usually blocks the iPhone from reaching Metro.');
      console.log('Fix: System Settings → Network → Firewall → Options');
      console.log('     Allow incoming connections for Node (or Terminal/iTerm).');
    } else {
      console.log('If the iPhone still cannot connect:');
      console.log('- Confirm Mac and iPhone use the same Wi-Fi (not a guest network).');
      console.log('- Disable “client isolation” / “AP isolation” on the router if enabled.');
    }
    console.log('');
    console.log('On the iPhone dev launcher: expand “Enter URL manually” and use:');
    console.log(`  http://${lanIp}:${port}`);
    console.log('');
    console.log('Note: curl to your own LAN IP from the Mac often fails even when the phone can connect.');
    process.exit(1);
  }

  console.log('LAN connectivity looks good.');
}

main();
