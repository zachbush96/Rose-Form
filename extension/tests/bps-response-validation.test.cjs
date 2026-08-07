const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const sidepanelSource = fs.readFileSync(path.join(extensionDir, 'sidepanel.js'), 'utf8');
const sidepanelHtml = fs.readFileSync(path.join(extensionDir, 'sidepanel.html'), 'utf8');
const sidepanelCss = fs.readFileSync(path.join(extensionDir, 'sidepanel.css'), 'utf8');

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
  }
  const start = sidepanelSource.indexOf('function jsonLineColumnFromPosition');
  const end = sidepanelSource.indexOf('function blockingDiagnostic');
  assert.notEqual(start, -1, 'JSON validation helpers start was not found');
  assert.notEqual(end, -1, 'JSON validation helpers end was not found');
  const context = { elements, $: id => elements[id] };
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
      new RegExp(`<textarea id="resp${promptNumber}"[^>]*aria-describedby="resp${promptNumber}Warning"[^>]*></textarea>\\s*<div id="resp${promptNumber}Warning" class="json-warning hidden" role="alert" aria-live="assertive"></div>`)
    );
  }
  assert.match(sidepanelCss, /\.json-warning\s*\{[^}]*border:\s*2px solid #dc2626/s);
  assert.match(sidepanelCss, /textarea\.json-invalid\s*\{[^}]*border:\s*2px solid #dc2626/s);
});

test('syntax-invalid JSON shows prompt, problem, location, and next action and blocks parsing', () => {
  const context = validationContext({ 2: '{\n  "symptoms": true' });

  assert.throws(() => context.parseBpsResponse(2), /Prompt 2 is not valid JSON/);
  const textarea = context.elements.resp2;
  const warning = context.elements.resp2Warning;
  assert.equal(textarea.attributes['aria-invalid'], 'true');
  assert.ok(textarea.classList.contains('json-invalid'));
  assert.ok(!warning.classList.contains('hidden'));
  assert.match(warning.textContent, /Prompt 2 — response blocked/);
  assert.match(warning.textContent, /Problem: The response ends before its JSON object is complete/);
  assert.match(warning.textContent, /Location: line 2, column \d+\./);
  assert.match(warning.textContent, /Next: Regenerate the complete BastionGPT response as one valid JSON object.*before filling\./s);
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
  assert.match(warning.textContent, /Missing substance_use\.substance_2\./);
  assert.match(warning.textContent, /Missing substance_use\.substance_3\./);
  assert.match(warning.textContent, /Missing substance_use\.other_substances\./);
  assert.match(warning.textContent, /tobacco must be top-level; found at substance_use\.tobacco\./);
  assert.match(warning.textContent, /Do not repair it by only appending a closing brace/);
});

test('Prompt 1 warning clears when the required JSON structure is corrected', () => {
  const context = validationContext({ 1: JSON.stringify(minimumCompletePrompt1()) });

  assert.doesNotThrow(() => context.parseBpsResponse(1));
  const textarea = context.elements.resp1;
  const warning = context.elements.resp1Warning;
  assert.equal(textarea.attributes['aria-invalid'], 'false');
  assert.ok(!textarea.classList.contains('json-invalid'));
  assert.ok(warning.classList.contains('hidden'));
  assert.equal(warning.textContent, '');
});

test('BPS merge and fill continue to route each response through blocking inline validation', () => {
  assert.match(sidepanelSource, /function parseJsonBox\(id\)[\s\S]*return parseBpsResponse\(Number\(promptMatch\[1\]\)\)/);
  assert.match(sidepanelSource, /function validateAndMerge\(\)[\s\S]*parseJsonBox\(`resp\$\{i\}`\)/);
  assert.match(sidepanelSource, /\$\('fillPage'\)\.onclick[\s\S]*const merged = validateAndMerge\(\)/);
});
