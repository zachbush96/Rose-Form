const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const repositoryDir = path.resolve(extensionDir, '..');
const sidepanelSource = fs.readFileSync(path.join(extensionDir, 'sidepanel.js'), 'utf8');

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

function configSafetyContext() {
  const start = sidepanelSource.indexOf('const BPS_SUICIDE_ATTEMPT_MAPPING');
  const end = sidepanelSource.indexOf('let activeConfig');
  assert.notEqual(start, -1, 'BPS safety helpers start was not found');
  assert.notEqual(end, -1, 'BPS safety helpers end was not found');
  const context = {};
  vm.createContext(context);
  vm.runInContext(sidepanelSource.slice(start, end), context);
  return context;
}

function legacyUnsafeConfig() {
  const config = remoteConfig();
  config.version = '0.4.6';
  const legacyPaths = new Map([
    [114, 'symptoms_suicide_self_harm.attempt_dates'],
    [115, 'symptoms_suicide_self_harm.attempt_methods'],
    [116, 'symptoms_suicide_self_harm.under_influence_during_attempts'],
    [117, 'symptoms_suicide_self_harm.feelings_about_past_attempts'],
    [118, 'symptoms_suicide_self_harm.protective_factors']
  ]);
  config.fieldMap = config.fieldMap.map(item => {
    if (!legacyPaths.has(item.fillIndex)) return item;
    const legacy = { ...item, paths: [legacyPaths.get(item.fillIndex)] };
    delete legacy.dataQnFieldId;
    return legacy;
  });
  config.prompts.find(item => item.id === 'prompt2').body =
    '{"attempt_dates":"","attempt_methods":"","under_influence_during_attempts":"","feelings_about_past_attempts":"","protective_factors":""}';
  return config;
}

function dryRunScreenshotPattern() {
  const config = remoteConfig();
  const fieldMap = config.fieldMap.filter(item => item.fillIndex >= 114 && item.fillIndex <= 118);
  const fields = fieldMap.map(item => ({
    tagName: 'TEXTAREA',
    type: 'textarea',
    id: `field-${item.dataQnFieldId}`,
    name: '',
    className: 'qn-textarea',
    value: '',
    checked: false,
    disabled: false,
    readOnly: false,
    outerHTML: `<textarea data-qn-field-id="${item.dataQnFieldId}"></textarea>`,
    parentElement: { innerText: '' },
    getAttribute(name) {
      if (name === 'data-qn-field-id') return item.dataQnFieldId;
      return '';
    },
    closest() { return null; }
  }));
  const context = {
    document: {
      title: 'ReliaTrax BPS test',
      querySelector() { return null; },
      querySelectorAll(selector) {
        return selector === config.selector ? fields : [];
      }
    },
    window: {},
    location: { href: 'https://reliatrax.example.test/bps' }
  };
  const start = sidepanelSource.indexOf('function pageFill');
  const end = sidepanelSource.indexOf('function buildRuntimeConfig');
  assert.notEqual(start, -1, 'Shared page filler start was not found');
  assert.notEqual(end, -1, 'Shared page filler end was not found');
  vm.createContext(context);
  vm.runInContext(sidepanelSource.slice(start, end), context);

  const response = {
    symptoms_suicide_self_harm: {
      history_suicide_attempts: { yes: true, no: false },
      attempt_count: '2',
      attempt_dates: 'January 2020; February 2021',
      attempt_methods: 'Client reports method details for the first and second attempts.',
      under_influence_during_attempts: 'Client reports substance-use context for the first attempt.',
      feelings_about_past_attempts: 'Client reports regretting past suicide attempts.',
      protective_factors: 'Client reports support from friends, recovery engagement, medication management, and future orientation.'
    }
  };
  return context.pageFill({
    ...config,
    expectedFieldCount: fields.length,
    fieldMap,
    defaultAnswers: [],
    defaultAnswersObject: {}
  }, response, true);
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

test('older or unsafe remote BPS config cannot replace the corrected bundled config', () => {
  const helpers = configSafetyContext();
  const bundled = bundledConfig();
  const decision = helpers.selectBpsConfig(legacyUnsafeConfig(), bundled, 'Remote');

  assert.equal(decision.source, 'bundled');
  assert.equal(decision.config.version, bundled.version);
  assert.match(decision.warning, /older than bundled/);
  assert.match(decision.warning, /protected suicide-attempt mapping is incomplete/);
  assert.throws(
    () => helpers.assertSafeBpsConfig(legacyUnsafeConfig()),
    /BPS fill blocked because config v0\.4\.6 could shift the suicide-attempt answers/
  );
});

test('a newer remote config is accepted only when the protected mapping remains intact', () => {
  const helpers = configSafetyContext();
  const newer = remoteConfig();
  newer.version = '0.4.9';
  const decision = helpers.selectBpsConfig(newer, bundledConfig(), 'Remote');

  assert.equal(decision.source, 'remote');
  assert.equal(decision.config.version, '0.4.9');
  assert.equal(decision.warning, '');
  assert.deepEqual(Array.from(helpers.bpsSuicideAttemptMappingIssues(newer)), []);
});

test('legacy Prompt 2 output fills the screenshot rows without shifting answers', () => {
  const result = dryRunScreenshotPattern();
  assert.equal(result.error, undefined);
  assert.match(result.warnings.join('\n'), /Combined legacy suicide-attempt date and method fields/);

  const traceById = new Map(result.trace.map(item => [item.dataQnFieldId, item]));
  assert.equal(
    traceById.get('10114').valueWritten,
    'January 2020; February 2021 Client reports method details for the first and second attempts.'
  );
  assert.equal(
    traceById.get('10115').valueWritten,
    'Client reports substance-use context for the first attempt.'
  );
  assert.equal(traceById.get('10116').valueWritten, 'Client reports regretting past suicide attempts.');
  assert.equal(
    traceById.get('10117').valueWritten,
    'Client reports support from friends, recovery engagement, medication management, and future orientation.'
  );
  assert.equal(traceById.get('10118').action, 'skip_blank');
});

test('standalone Prompt 2 and sample response use the corrected suicide-attempt shape', () => {
  const prompt2 = fs.readFileSync(path.join(repositoryDir, 'github-data', 'prompts', 'prompt-2.txt'), 'utf8');
  const sample = JSON.parse(fs.readFileSync(path.join(repositoryDir, 'github-data', 'sample-empty-combined-response.json'), 'utf8'));
  const suicide = sample.symptoms_suicide_self_harm;

  assert.match(prompt2, /"attempt_dates_and_methods":""/);
  assert.match(prompt2, /"future_attempt_triggers":""/);
  assert.doesNotMatch(prompt2, /"attempt_methods":""/);
  assert.ok(Object.hasOwn(suicide, 'attempt_dates_and_methods'));
  assert.ok(Object.hasOwn(suicide, 'future_attempt_triggers'));
  assert.ok(!Object.hasOwn(suicide, 'attempt_dates'));
  assert.ok(!Object.hasOwn(suicide, 'attempt_methods'));
});
