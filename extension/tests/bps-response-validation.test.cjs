const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const sidepanelSource = fs.readFileSync(path.join(extensionDir, 'sidepanel.js'), 'utf8');
const sidepanelHtml = fs.readFileSync(path.join(extensionDir, 'sidepanel.html'), 'utf8');
const sidepanelCss = fs.readFileSync(path.join(extensionDir, 'sidepanel.css'), 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(extensionDir, 'service-worker.js'), 'utf8');
const n8nConfigSource = fs.readFileSync(path.join(extensionDir, 'n8n-config.js'), 'utf8');
const workflowConfigSource = fs.readFileSync(path.join(extensionDir, 'workflow-config.js'), 'utf8');
const treatmentConfigSource = fs.readFileSync(path.join(extensionDir, 'treatment-config.js'), 'utf8');

function fakeClassList(initial = []) {
  const classes = new Set(initial);
  return {
    toggle(name, force) {
      if (force) classes.add(name);
      else classes.delete(name);
    },
    contains(name) { return classes.has(name); }
  };
}

function validationContext(values = {}) {
  const elements = {};
  for (let promptNumber = 1; promptNumber <= 4; promptNumber++) {
    elements[`resp${promptNumber}`] = {
      value: values[promptNumber] || '',
      attributes: {},
      classList: fakeClassList(),
      setAttribute(name, value) { this.attributes[name] = value; }
    };
    elements[`resp${promptNumber}Warning`] = {
      textContent: '',
      classList: fakeClassList(['hidden'])
    };
    elements[`resp${promptNumber}WarningText`] = { textContent: '' };
    elements[`resp${promptNumber}Repair`] = { disabled: false };
    elements[`resp${promptNumber}RepairStatus`] = { textContent: '' };
    elements[`resp${promptNumber}RepairResult`] = { textContent: '', classList: fakeClassList(['hidden']) };
  }
  const start = sidepanelSource.indexOf('function jsonLineColumnFromPosition');
  const end = sidepanelSource.indexOf('function blockingDiagnostic');
  assert.notEqual(start, -1, 'JSON validation helpers start was not found');
  assert.notEqual(end, -1, 'JSON validation helpers end was not found');
  const context = { elements, $: id => elements[id], activeConfig: { prompts: [] } };
  vm.createContext(context);
  vm.runInContext(sidepanelSource.slice(start, end), context);
  return context;
}

function minimumCompletePrompt1() {
  return {
    living_situation: {},
    substance_use: {
      no_history: false,
      substance_1: {},
      substance_2: {},
      substance_3: {},
      other_substances: ''
    },
    tobacco: {},
    withdrawal: {},
    previous_substance_use_treatment: {}
  };
}

test('each BPS textarea has an accessible inline alert directly beneath it', () => {
  for (let promptNumber = 1; promptNumber <= 4; promptNumber++) {
    assert.match(
      sidepanelHtml,
      new RegExp(`<textarea id="resp${promptNumber}"[^>]*aria-describedby="resp${promptNumber}Warning"[^>]*></textarea>\\s*<div id="resp${promptNumber}Warning" class="json-warning hidden" role="alert" aria-live="assertive">[\\s\\S]*?<button id="resp${promptNumber}Repair"[^>]*>Correct with ChatGPT</button>`)
    );
  }
  assert.match(sidepanelCss, /\.json-warning\s*\{[^}]*border:\s*2px solid #dc2626/s);
  assert.match(sidepanelCss, /textarea\.json-invalid\s*\{[^}]*border:\s*2px solid #dc2626/s);
});

test('support and config sections are collapsible and collapsed by default', () => {
  const sections = [
    ['troubleshootingPane', 'Troubleshooting trace log'],
    ['n8nTroubleshootingPane', 'n8n troubleshooting'],
    ['remoteConfigPane', 'Remote config']
  ];

  for (const [id, title] of sections) {
    assert.match(
      sidepanelHtml,
      new RegExp(`<details class="[^"]*\\bcollapsible\\b[^"]*" id="${id}">\\s*<summary(?:>|[\\s>])[\\s\\S]*?${title}`)
    );
    assert.doesNotMatch(sidepanelHtml, new RegExp(`<details[^>]*id="${id}"[^>]*\\sopen(?:\\s|=|>)`));
  }
});

test('syntax-invalid JSON shows a simple actionable message and blocks parsing', () => {
  const context = validationContext({ 2: '{\n  "symptoms": true' });

  assert.throws(() => context.parseBpsResponse(2), /Prompt 2 is not valid JSON/);
  const textarea = context.elements.resp2;
  const warning = context.elements.resp2Warning;
  assert.equal(textarea.attributes['aria-invalid'], 'true');
  assert.ok(textarea.classList.contains('json-invalid'));
  assert.ok(!warning.classList.contains('hidden'));
  const warningText = context.elements.resp2WarningText.textContent;
  assert.equal(warningText, [
    'Prompt 2 needs correction.',
    'This response could not be read, so nothing was filled.',
    'Use Correct with ChatGPT below, or paste a new response and try again.'
  ].join('\n'));
  assert.doesNotMatch(warningText, /Parser:|Location:|line \d+|column \d+|Unexpected|Expected/);
});

test('Prompt 1 remains blocked after syntax repair when required blocks are missing or nested', () => {
  const repairedButIncomplete = {
    living_situation: {},
    substance_use: {
      no_history: false,
      substance_1: {},
      tobacco: {},
      withdrawal: {},
      previous_substance_use_treatment: {}
    }
  };
  const context = validationContext({ 1: JSON.stringify(repairedButIncomplete) });

  assert.throws(() => context.parseBpsResponse(1), /incomplete or incorrectly structured/);
  const warning = context.elements.resp1Warning;
  const warningText = context.elements.resp1WarningText.textContent;
  assert.equal(warningText, [
    'Prompt 1 needs correction.',
    'This response could not be read, so nothing was filled.',
    'Use Correct with ChatGPT below, or paste a new response and try again.'
  ].join('\n'));
});

test('Prompt 1 warning clears when the required JSON structure is corrected', () => {
  const context = validationContext({ 1: JSON.stringify(minimumCompletePrompt1()) });

  assert.doesNotThrow(() => context.parseBpsResponse(1));
  const textarea = context.elements.resp1;
  const warning = context.elements.resp1Warning;
  assert.equal(textarea.attributes['aria-invalid'], 'false');
  assert.ok(!textarea.classList.contains('json-invalid'));
  assert.ok(warning.classList.contains('hidden'));
  assert.equal(context.elements.resp1WarningText.textContent, '');
});

test('n8n repair accepts punctuation and nesting changes only', () => {
  const context = validationContext();
  const malformed = '{"legal":{"count":"1"},"family":{"note":"same","spiritual_cultural":{"religion":"none"},"medical":{"status":"ok","medications":{"medication_1":"none"}}}}';
  const corrected = '{"legal":{"count":"1"},"family":{"note":"same"},"spiritual_cultural":{"religion":"none"},"medical":{"status":"ok"},"medications":{"medication_1":"none"}}';
  const result = context.validateJsonRepairForTarget(malformed, corrected, {
    label: 'BPS Prompt 3',
    promptNumber: 3,
    expectedTopLevelKeys: ['legal', 'family', 'spiritual_cultural', 'medical', 'medications'],
    knownGoodExample: corrected,
    strictShape: true
  });
  assert.deepEqual(Object.keys(result), ['legal', 'family', 'spiritual_cultural', 'medical', 'medications']);
});

test('n8n repair is rejected if any key or value changes', () => {
  const context = validationContext();
  const malformed = '{"legal":{},"family":{},"spiritual_cultural":{},"medical":{},"medications":{"name":"Raylar"}';
  const changed = '{"legal":{},"family":{},"spiritual_cultural":{},"medical":{},"medications":{"name":"Vraylar"}}';
  const target = {
    label: 'BPS Prompt 3',
    promptNumber: 3,
    expectedTopLevelKeys: ['legal', 'family', 'spiritual_cultural', 'medical', 'medications'],
    knownGoodExample: changed,
    strictShape: true
  };
  assert.throws(() => context.validateJsonRepairForTarget(malformed, changed, target), /changed, added, removed, or reordered a key or value/);
});

test('repair preserves raw line breaks inside JSON strings while fixing their escaping', () => {
  const context = validationContext();
  const corrected = JSON.stringify({ mse: { items: { mood: { selections: [], other_text: 'Line one\nLine two' } } } });
  const malformed = corrected.replace('\\n', '\n').slice(0, -1);
  const result = context.validateJsonRepairForTarget(malformed, corrected, {
    label: 'MSE Part 2',
    expectedTopLevelKeys: ['mse'],
    knownGoodExample: corrected,
    strictShape: true
  });
  assert.equal(result.mse.items.mood.other_text, 'Line one\nLine two');
});

test('repair request derives the complete perfect shape from the active prompt', () => {
  const context = validationContext();
  context.activeConfig.prompts = [{
    id: 'prompt3',
    body: 'Instructions. Return ONLY this JSON structure: {"legal":{"count":""},"family":{},"spiritual_cultural":{},"medical":{},"medications":{"medication_1":{"name":""}}}'
  }];
  assert.equal(
    context.bpsPromptExpectedOutputShape(3),
    '{"legal":{"count":""},"family":{},"spiritual_cultural":{},"medical":{},"medications":{"medication_1":{"name":""}}}'
  );
});

test('repair posts the failed response and known-good example directly to n8n', () => {
  assert.match(n8nConfigSource, /repairUrl:/);
  assert.match(sidepanelSource, /fetch\(url,\s*\{[\s\S]*event:\s*'rose_json_repair_request'/);
  assert.match(sidepanelSource, /requestVersion:\s*2/);
  assert.match(sidepanelSource, /responseType,\s*\n\s*mode,\s*\n\s*responseLabel,\s*\n\s*rawJson,\s*\n\s*expectedTopLevelKeys,\s*\n\s*knownGoodExample,\s*\n\s*strictShape/);
  assert.doesNotMatch(sidepanelSource, /chrome\.runtime\.sendMessage\(\{\s*type:\s*'repair-bps-json'/);
  assert.doesNotMatch(serviceWorkerSource, /api\.openai\.com|ROSE_OPENAI_API_KEY|repair-bps-json/);
});

test('n8n repair request sends the exact failed JSON and known-good example', async () => {
  const start = sidepanelSource.indexOf('function n8nJsonRepairUrl');
  const end = sidepanelSource.indexOf('async function repairBpsResponseWithN8n', start);
  const requests = [];
  const context = {
    N8N_LOGGING_CONFIG: {
      enabled: true,
      repairUrl: 'https://n8n.example/webhook/repair',
      repairRequestTimeoutMs: 45000
    },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true, correctedJson: '{"legal":{}}' })
      };
    }
  };
  vm.createContext(context);
  vm.runInContext(sidepanelSource.slice(start, end), context);
  const request = {
    responseType: 'asam',
    mode: 'asam',
    responseLabel: 'Case Management and ASAM Part 3',
    rawJson: '{"legal":{}',
    expectedTopLevelKeys: ['legal', 'family'],
    knownGoodExample: '{"legal":{"status":""},"family":{"details":""}}',
    strictShape: true
  };

  const result = await context.requestN8nJsonRepair(request);

  assert.equal(result.correctedJson, '{"legal":{}}');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://n8n.example/webhook/repair');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    event: 'rose_json_repair_request',
    requestVersion: 2,
    ...request
  });
});

test('returned correction is locally validated before replacing and saving the textbox', () => {
  const repairStart = sidepanelSource.indexOf('async function repairJsonResponseWithN8n');
  const repairEnd = sidepanelSource.indexOf('async function repairBpsResponseWithN8n', repairStart);
  const repairSource = sidepanelSource.slice(repairStart, repairEnd);
  assert.ok(repairStart >= 0 && repairEnd > repairStart);
  assert.match(repairSource, /const corrected = validateJsonRepairForTarget\(rawJson, response\.correctedJson, target\);/);
  assert.ok(repairSource.indexOf('validateJsonRepairForTarget') < repairSource.indexOf('textarea.value'));
  assert.ok(repairSource.indexOf('target.validateCurrent') < repairSource.indexOf('target.save'));
  assert.match(repairSource, /catch \(err\) \{\s*textarea\.value = originalValue;\s*throw err;/);
});

test('repair button shows an animated busy state and blocks repeat clicks', () => {
  const repairStart = sidepanelSource.indexOf('async function repairJsonResponseWithN8n');
  const repairEnd = sidepanelSource.indexOf('async function repairBpsResponseWithN8n', repairStart);
  const repairSource = sidepanelSource.slice(repairStart, repairEnd);
  assert.match(repairSource, /if \(button\?\.disabled\) return;/);
  assert.match(repairSource, /button\.disabled = true;[\s\S]*classList\.add\('is-loading'\)[\s\S]*setAttribute\('aria-busy', 'true'\)/);
  assert.match(repairSource, /classList\.remove\('is-loading'\)[\s\S]*removeAttribute\('aria-busy'\)[\s\S]*button\.disabled = false|button\.disabled = false;[\s\S]*classList\.remove\('is-loading'\)[\s\S]*removeAttribute\('aria-busy'\)/);
  assert.match(sidepanelCss, /\.json-repair-button\.is-loading::before[\s\S]*animation:\s*json-repair-spin/);
  assert.match(sidepanelCss, /@keyframes json-repair-spin/);
});

test('every response mode exposes the same correction control', () => {
  const responseIds = ['resp1', 'resp2', 'resp3', 'resp4', 'mseResp', 'asamResp', 'diagnosticsResp', 'treatmentResp', 'quicknotesResp'];
  for (const responseId of responseIds) {
    assert.match(sidepanelHtml, new RegExp(`id="${responseId}Repair"[^>]*>Correct with ChatGPT</button>`));
  }
  assert.match(sidepanelSource, /\['mse', 'asam', 'diagnostics', 'treatment', 'quicknotes'\]/);
});

test('each non-BPS repair target uses a bundled known-good JSON example', () => {
  assert.match(sidepanelSource, /mse:[\s\S]*knownGoodExample: workflowModeKnownGoodExample\('mse'\)/);
  assert.match(sidepanelSource, /asam:[\s\S]*knownGoodExample: workflowModeKnownGoodExample\('asam'\)/);
  assert.match(sidepanelSource, /diagnostics:[\s\S]*knownGoodExample: workflowModeKnownGoodExample\('diagnostics'\)/);
  assert.match(sidepanelSource, /treatment:[\s\S]*knownGoodExample: treatmentKnownGoodExample\(\)/);
  assert.match(sidepanelSource, /quicknotes:[\s\S]*knownGoodExample: quickNotesKnownGoodExample\(\)/);
});

test('bundled mode prompts yield parseable known-good examples with exact top-level keys', () => {
  const configContext = { window: {} };
  vm.createContext(configContext);
  vm.runInContext(workflowConfigSource, configContext);
  vm.runInContext(treatmentConfigSource, configContext);
  const start = sidepanelSource.indexOf('function firstCompleteJsonObject');
  const end = sidepanelSource.indexOf('const BPS_PROMPT_1_REQUIRED_SHAPE', start);
  const helperContext = {
    window: configContext.window,
    workflowConfig: configContext.window.DEFAULT_ROSE_WORKFLOW_CONFIG,
    treatmentConfig: configContext.window.DEFAULT_ROSE_TREATMENT_CONFIG,
    workflowMode: mode => configContext.window.DEFAULT_ROSE_WORKFLOW_CONFIG.modes[mode],
    selectedTreatmentPrompt: () => ({ id: 'sud_outpatient' })
  };
  vm.createContext(helperContext);
  vm.runInContext(sidepanelSource.slice(start, end), helperContext);
  const expected = {
    mse: ['mse'],
    asam: ['case_management', 'asam_criteria', 'safety_planning', 'assessment_summary', 'clinical_recommendations', 'dsm_v', 'level_of_care', 'quality_check'],
    diagnostics: ['screening_results', 'assessment_summary', 'clinical_recommendations', 'dsm_v', 'level_of_care', 'quality_check']
  };
  for (const [mode, keys] of Object.entries(expected)) {
    assert.deepEqual(Object.keys(JSON.parse(helperContext.workflowModeKnownGoodExample(mode))), keys);
  }
  assert.deepEqual(Object.keys(JSON.parse(helperContext.treatmentKnownGoodExample())), ['treatment_plan']);
  assert.deepEqual(Object.keys(JSON.parse(helperContext.quickNotesKnownGoodExample())), ['quicknotes']);
});

test('BPS merge and fill continue to route each response through blocking inline validation', () => {
  assert.match(sidepanelSource, /function parseJsonBox\(id\)[\s\S]*return parseBpsResponse\(Number\(promptMatch\[1\]\)\)/);
  assert.match(sidepanelSource, /function validateAndMerge\(\)[\s\S]*parseJsonBox\(`resp\$\{i\}`\)/);
  assert.match(sidepanelSource, /\$\('fillPage'\)\.onclick[\s\S]*const merged = validateAndMerge\(\)/);
});
