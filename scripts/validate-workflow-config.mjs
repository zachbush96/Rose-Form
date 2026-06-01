import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const githubConfigPath = path.join(repoRoot, 'github-data', 'rose-reliatrax-workflows-config.json');
const bundledConfigPath = path.join(repoRoot, 'extension', 'workflow-config.js');

const githubConfig = JSON.parse(fs.readFileSync(githubConfigPath, 'utf8'));
const bundledSource = fs.readFileSync(bundledConfigPath, 'utf8');
const bundledJson = bundledSource
  .replace(/^window\.DEFAULT_ROSE_WORKFLOW_CONFIG = /, '')
  .replace(/;\s*$/, '');
const bundledConfig = JSON.parse(bundledJson);
const failures = [];

const canonical = (value) => JSON.stringify(value);
if (canonical(githubConfig) !== canonical(bundledConfig)) {
  failures.push('Bundled extension workflow config does not match github-data workflow config.');
}

for (const [modeName, mode] of Object.entries(githubConfig.modes || {})) {
  if (mode.mappingStatus !== 'mapped') continue;
  if (modeName === 'quicknotes') {
    if (!mode.configUrl) failures.push('quicknotes is mapped but has no configUrl.');
    continue;
  }
  if (!Array.isArray(mode.fieldMap) || !mode.fieldMap.length) {
    failures.push(`${modeName} is mapped but has no fieldMap entries.`);
  }
  if (!mode.selector) failures.push(`${modeName} is mapped but has no selector.`);
  if (!Number.isInteger(mode.expectedFieldCount) || mode.expectedFieldCount <= 0) {
    failures.push(`${modeName} is mapped but has no positive expectedFieldCount.`);
  }
}

const asam = githubConfig.modes?.asam;
if (asam?.mappingStatus === 'mapped') {
  if (asam.fieldMap.length !== 40) failures.push(`asam fieldMap expected 40 entries, found ${asam.fieldMap.length}.`);
  if ((asam.defaultAnswers || []).length !== 32) failures.push(`asam defaultAnswers expected 32 entries, found ${(asam.defaultAnswers || []).length}.`);
  if (asam.onlyVisibleControls !== false) failures.push('asam must use onlyVisibleControls false for the deep-capture fill indexes.');
  const fillIndexes = new Set(asam.fieldMap.map(item => item.fillIndex));
  for (let index = 455; index <= 494; index++) {
    if (!fillIndexes.has(index)) failures.push(`asam fieldMap is missing fillIndex ${index}.`);
  }
}

console.log(JSON.stringify({
  version: githubConfig.version,
  modes: Object.fromEntries(Object.entries(githubConfig.modes || {}).map(([key, mode]) => [
    key,
    {
      mappingStatus: mode.mappingStatus || '',
      fieldMap: Array.isArray(mode.fieldMap) ? mode.fieldMap.length : null,
      expectedFieldCount: mode.expectedFieldCount || null
    }
  ])),
  failures
}, null, 2));

if (failures.length) process.exit(1);
