#!/usr/bin/env node
/**
 * Enforces Expo Go-first and keep-it-small project rules.
 * Run via: npm run check:expo-go (also runs automatically before npm test and in CI).
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const policyPath = path.join(__dirname, 'expo-go-policy.json');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const errors = [];

const read = (relativePath) => {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
};

const checkPackageScripts = () => {
  const pkg = JSON.parse(read('package.json'));
  if (!pkg) {
    return;
  }

  for (const [name, expected] of Object.entries(policy.defaultScripts)) {
    const actual = pkg.scripts?.[name];
    if (actual !== expected) {
      errors.push(
        `package.json scripts.${name} must be "${expected}" (found: ${JSON.stringify(actual)})`
      );
    }
  }

  const productionDeps = Object.keys(pkg.dependencies ?? {});
  const allowed = new Set(policy.allowedProductionDependencies);
  for (const dep of productionDeps) {
    if (!allowed.has(dep)) {
      errors.push(
        `Dependency "${dep}" is not in scripts/expo-go-policy.json allowlist. ` +
          'Add only Expo Go–compatible packages, or update the allowlist deliberately.'
      );
    }
  }
};

const checkRule = () => {
  const { path: rulePath, mustContain } = policy.requiredRule;
  const content = read(rulePath);
  if (!content) {
    return;
  }
  for (const phrase of mustContain) {
    if (!content.includes(phrase)) {
      errors.push(`${rulePath} must contain: ${phrase}`);
    }
  }
};

const checkDocs = () => {
  for (const [docPath, phrases] of Object.entries(policy.requiredDocPhrases)) {
    const content = read(docPath);
    if (!content) {
      continue;
    }
    for (const phrase of phrases) {
      if (!content.includes(phrase)) {
        errors.push(`${docPath} must mention: ${phrase}`);
      }
    }
  }
};

const checkFiles = () => {
  for (const [relativePath, rules] of Object.entries(policy.fileChecks)) {
    const content = read(relativePath);
    if (!content) {
      continue;
    }
    for (const phrase of rules.mustContain ?? []) {
      if (!content.includes(phrase)) {
        errors.push(`${relativePath} must contain: ${phrase}`);
      }
    }
    for (const phrase of rules.mustNotContain ?? []) {
      if (content.includes(phrase)) {
        errors.push(`${relativePath} must not contain: ${phrase}`);
      }
    }
  }
};

checkPackageScripts();
checkRule();
checkDocs();
checkFiles();

if (errors.length > 0) {
  console.error('Expo Go policy check failed:\n');
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  console.error('\nSee .cursor/rules/expo-go-first.mdc and scripts/expo-go-policy.json');
  process.exit(1);
}

console.log('Expo Go policy check passed.');
