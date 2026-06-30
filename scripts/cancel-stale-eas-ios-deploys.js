#!/usr/bin/env node
/**
 * Cancel in-flight EAS iOS production builds before starting a new deploy.
 * GitHub Actions concurrency stops the runner, but EAS builds keep running unless
 * explicitly cancelled via the EAS API/CLI.
 */
const { execFileSync } = require('child_process');

const PLATFORM = process.env.EAS_CANCEL_PLATFORM || 'ios';
const PROFILE = process.env.EAS_CANCEL_PROFILE || 'production';
const ACTIVE_STATUSES = ['new', 'in-queue', 'in-progress', 'pending-cancel'];

const runEasJson = (args) => {
  const output = execFileSync('npx', ['eas', ...args, '--json', '--non-interactive'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start === -1 || end === -1) {
    return [];
  }

  return JSON.parse(output.slice(start, end + 1));
};

const cancelBuild = (buildId) => {
  execFileSync('npx', ['eas', 'build:cancel', buildId, '--non-interactive'], {
    encoding: 'utf8',
    stdio: 'inherit',
    env: process.env,
  });
};

const listActiveBuilds = () => {
  const byId = new Map();

  for (const status of ACTIVE_STATUSES) {
    const builds = runEasJson([
      'build:list',
      '--platform',
      PLATFORM,
      '--build-profile',
      PROFILE,
      '--status',
      status,
      '--limit',
      '25',
    ]);

    for (const build of builds) {
      if (build?.id) {
        byId.set(build.id, build);
      }
    }
  }

  return [...byId.values()];
};

const main = () => {
  if (!process.env.EXPO_TOKEN) {
    console.error('EXPO_TOKEN is required to cancel EAS builds.');
    process.exit(1);
  }

  const builds = listActiveBuilds();
  if (builds.length === 0) {
    console.log(`No active ${PLATFORM}/${PROFILE} EAS builds to cancel.`);
    return;
  }

  console.log(`Cancelling ${builds.length} active EAS build(s)…`);
  for (const build of builds) {
    console.log(`- ${build.id} (${build.status})`);
    try {
      cancelBuild(build.id);
    } catch (error) {
      console.warn(`Could not cancel build ${build.id}: ${error.message}`);
    }
  }

  console.log('Stale EAS build cancellation finished.');
  console.log(
    'Note: EAS Submit does not expose a cancel command. Pending auto-submit jobs tied to a cancelled build are dropped; an upload already in progress may still finish.'
  );
};

main();
