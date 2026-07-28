const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const repositoryDir = path.resolve(extensionDir, '..');
const sidepanelSource = fs.readFileSync(path.join(extensionDir, 'sidepanel.js'), 'utf8');
const treatmentStart = sidepanelSource.indexOf('function normalizeTreatmentHeading');
const treatmentEnd = sidepanelSource.indexOf('function validateTreatmentResponse');

assert.notEqual(treatmentStart, -1, 'Treatment parser start was not found');
assert.notEqual(treatmentEnd, -1, 'Treatment parser end was not found');

const context = {
  blockingDiagnostic(details) {
    const error = new Error(details.message);
    error.diagnostic = details;
    return error;
  },
  parseJsonWithDiagnostic(value) {
    return JSON.parse(value);
  }
};
vm.createContext(context);
vm.runInContext(sidepanelSource.slice(treatmentStart, treatmentEnd), context);

function problem(number, domain, timeframe, options = {}) {
  const timeframeHeading = options.estimated ? 'Estimated Length of Treatment' : 'Target Date';
  const completion = options.completion ? `\n\nCompletion Date\n\n${options.completion}` : '';
  const statement = options.statement || `Jordan has a clinically supported need for problem ${number}.`;
  return [
    `PROBLEM #${number}`,
    '',
    'Problem Statement',
    '',
    statement,
    '',
    domain ? `Goal (${domain})` : 'Goal',
    '',
    `Jordan will make progress in problem ${number}.`,
    '',
    timeframeHeading,
    '',
    timeframe,
    completion,
    '',
    'Objectives',
    '',
    `1. Jordan will engage with the recommended services for problem ${number}.`,
    `2. Jordan will strengthen clinically appropriate skills for problem ${number}.`,
    '',
    'Therapeutic Interventions',
    '',
    `1. Clinician will provide an individualized intervention for problem ${number}.`,
    `2. Clinician will support clinically appropriate planning for problem ${number}.`,
    '',
    'Review/Comments',
    '',
    options.review || 'To be completed at treatment plan review.'
  ].join('\n');
}

function planText(problems, nextReview) {
  return [
    'Strengths',
    '',
    'Jordan demonstrates motivation and useful protective factors.',
    '',
    'Risk Factors',
    '',
    'Jordan has clinically relevant risk factors requiring treatment planning.',
    '',
    ...problems,
    '',
    'Safety Planning',
    '',
    'Jordan reports no current suicidal or homicidal ideation and received emergency resource information.',
    '',
    'Next Review Date',
    '',
    nextReview
  ].join('\n');
}

test('bundled and GitHub treatment prompt configs are exact mirrors', () => {
  const browserContext = { window: {} };
  vm.createContext(browserContext);
  vm.runInContext(fs.readFileSync(path.join(extensionDir, 'treatment-config.js'), 'utf8'), browserContext);
  const remoteConfig = JSON.parse(fs.readFileSync(path.join(repositoryDir, 'github-data', 'rose-treatment-plan-config.json'), 'utf8'));

  assert.deepEqual(JSON.parse(JSON.stringify(browserContext.window.DEFAULT_ROSE_TREATMENT_CONFIG)), remoteConfig);
  assert.equal(remoteConfig.source.gmailMessageId, '19fa163fd2ce7c84');
  assert.deepEqual(remoteConfig.prompts.map(prompt => prompt.id), [
    'sud_outpatient',
    'sud_detox_first',
    'higher_level_asam_3_7',
    'non_sud_refer_out'
  ]);
});

test('effective prompts preserve Rose clinical content and append the JSON-only contract', () => {
  const remoteConfig = JSON.parse(fs.readFileSync(path.join(repositoryDir, 'github-data', 'rose-treatment-plan-config.json'), 'utf8'));
  const helperStart = sidepanelSource.indexOf('function treatmentPromptOutputInstructions');
  const helperEnd = sidepanelSource.indexOf('function renderTreatmentPrompt');
  const helperContext = { treatmentConfig: remoteConfig };
  vm.createContext(helperContext);
  vm.runInContext(sidepanelSource.slice(helperStart, helperEnd), helperContext);

  remoteConfig.prompts.forEach(prompt => {
    const effective = helperContext.effectiveTreatmentPrompt(prompt);
    assert.ok(effective.startsWith(prompt.body));
    assert.match(effective, /Return one valid JSON object only/);
    assert.match(effective, new RegExp(`"scenario": "${prompt.id}"`));
    assert.doesNotMatch(effective, /\{\{SCENARIO_ID\}\}/);
  });
});

test('JSON parser and safeguards accept the SUD outpatient scenario', () => {
  const text = planText([
    problem(1, 'Recovery', '90 days', { completion: 'October 2026' }),
    problem(2, 'Life Skills', '90 days', { completion: 'October 2026' }),
    problem(3, 'Emotional Regulation', '90 days', { completion: 'October 2026' })
  ], '90 days from treatment plan initiation.');
  const legacyParsed = context.parseTreatmentPlanText(text, 'sud_outpatient');
  const parsed = context.parseTreatmentPlanText(JSON.stringify(legacyParsed), 'sud_outpatient').treatment_plan;

  assert.equal(parsed.problems.length, 3);
  assert.equal(context.treatmentScenarioWarnings(parsed, 'sud_outpatient').length, 0);
});

test('JSON parser treats Estimated Length of Treatment as the detox timeframe', () => {
  const text = planText([
    problem(1, 'Detox', '7–10 days', {
      estimated: true,
      statement: 'Jordan requires medically supervised detoxification due to withdrawal risk.'
    }),
    problem(2, 'Recovery', '90 days', { estimated: true }),
    problem(3, 'Life Skills', '90 days', { estimated: true })
  ], '180 days from treatment plan initiation.');
  const legacyParsed = context.parseTreatmentPlanText(text, 'sud_detox_first');
  const parsed = context.parseTreatmentPlanText(JSON.stringify(legacyParsed), 'sud_detox_first').treatment_plan;

  assert.equal(parsed.problems[0].target_date, '7–10 days');
  assert.equal(context.treatmentScenarioWarnings(parsed, 'sud_detox_first').length, 0);
});

test('JSON parser and safeguards accept the ASAM 3.7 scenario', () => {
  const asamStatement = 'Jordan requires Medically Managed Residential Stabilization (ASAM 3.7) based on the clinical presentation.';
  const text = planText([
    problem(1, 'Stabilization', '5–7 days', { statement: asamStatement }),
    problem(2, 'Withdrawal Management', '7–10 days', { statement: asamStatement }),
    problem(3, 'Psychiatric Stabilization', '10–14 days', { statement: asamStatement })
  ], 'To occur following stabilization or transition to appropriate ongoing level of care.');
  const legacyParsed = context.parseTreatmentPlanText(text, 'higher_level_asam_3_7');
  const parsed = context.parseTreatmentPlanText(JSON.stringify(legacyParsed), 'higher_level_asam_3_7').treatment_plan;

  assert.equal(context.treatmentScenarioWarnings(parsed, 'higher_level_asam_3_7').length, 0);
});

test('JSON parser and safeguards accept the non-SUD referral scenario', () => {
  const text = planText([
    problem(1, '', '30 days', { completion: 'August 2026' }),
    problem(2, '', '30 days', { completion: 'August 2026' }),
    problem(3, '', '30 days', { completion: 'August 2026' })
  ], '30 days from treatment plan initiation.');
  const legacyParsed = context.parseTreatmentPlanText(text, 'non_sud_refer_out');
  const parsed = context.parseTreatmentPlanText(JSON.stringify(legacyParsed), 'non_sud_refer_out').treatment_plan;

  assert.equal(context.treatmentScenarioWarnings(parsed, 'non_sud_refer_out').length, 0);
});

test('scenario safeguards warn without blocking easy clinical overrides', () => {
  const text = planText([
    problem(1, 'Recovery', '90 days', { completion: 'October 2026' }),
    problem(2, 'Life Skills', '90 days', { completion: 'October 2026' }),
    problem(3, 'Emotional Regulation', '90 days', { completion: 'October 2026' })
  ], '180 days from treatment plan initiation.');
  const parsed = context.parseTreatmentPlanText(text, 'sud_outpatient').treatment_plan;
  const warnings = context.treatmentScenarioWarnings(parsed, 'sud_outpatient');

  assert.ok(warnings.some(warning => warning.includes('Next Review Date')));
  assert.equal(parsed.next_review_date, '180 days from treatment plan initiation.');
});
