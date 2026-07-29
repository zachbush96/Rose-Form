const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const repositoryDir = path.resolve(extensionDir, '..');

function bundledConfig() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(extensionDir, 'default-config.js'), 'utf8'), context);
  return JSON.parse(JSON.stringify(context.window.DEFAULT_ROSE_BPS_CONFIG));
}

function remoteConfig() {
  return JSON.parse(fs.readFileSync(
    path.join(repositoryDir, 'github-data', 'rose-reliatrax-bps-config.json'),
    'utf8'
  ));
}

test('bundled and GitHub BPS configs remain exact mirrors', () => {
  assert.deepEqual(bundledConfig(), remoteConfig());
});

test('BPS suicide-attempt questions map to the live ReliaTrax order', () => {
  const config = remoteConfig();
  const expected = [
    [114, '10114', 'symptoms_suicide_self_harm.attempt_dates_and_methods'],
    [115, '10115', 'symptoms_suicide_self_harm.under_influence_during_attempts'],
    [116, '10116', 'symptoms_suicide_self_harm.feelings_about_past_attempts'],
    [117, '10117', 'symptoms_suicide_self_harm.protective_factors'],
    [118, '10118', 'symptoms_suicide_self_harm.future_attempt_triggers']
  ];

  assert.deepEqual(
    config.fieldMap
      .filter(item => item.fillIndex >= 114 && item.fillIndex <= 118)
      .map(item => [item.fillIndex, item.dataQnFieldId, item.paths[0]]),
    expected
  );
  assert.equal(config.fieldMap.length, config.expectedFieldCount);
});

test('Prompt 2 requests the combined attempt detail and future-trigger fields', () => {
  const prompt = remoteConfig().prompts.find(item => item.id === 'prompt2').body;

  assert.match(prompt, /"attempt_dates_and_methods":""/);
  assert.match(prompt, /"future_attempt_triggers":""/);
  assert.doesNotMatch(prompt, /"attempt_methods":""/);
});
