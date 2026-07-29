const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '..');
const repositoryDir = path.resolve(extensionDir, '..');
const sidepanelSource = fs.readFileSync(path.join(extensionDir, 'sidepanel.js'), 'utf8');
const sidepanelHtml = fs.readFileSync(path.join(extensionDir, 'sidepanel.html'), 'utf8');
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
    assert.match(effective, /Do not include numeric prefixes or bullet characters/);
    assert.match(effective, /CURRENT DATE FOR COMPLETION DATE CALCULATIONS/);
    assert.match(effective, /For a range, use the upper number/);
  });
});

test('Treatment Plan fills the webpage by default', () => {
  const checkbox = sidepanelHtml.match(/<input[^>]+id="treatmentDryRun"[^>]*>/)?.[0] || '';
  assert.ok(checkbox);
  assert.doesNotMatch(checkbox, /\bchecked\b/);
});

test('shared filler preserves client wording from generated responses', () => {
  const fillStart = sidepanelSource.indexOf('function pageFill');
  const fillEnd = sidepanelSource.indexOf('function buildMseRuntimeConfig');
  assert.notEqual(fillStart, -1, 'Shared page filler start was not found');
  assert.notEqual(fillEnd, -1, 'Shared page filler end was not found');

  const fillSource = sidepanelSource.slice(fillStart, fillEnd);
  assert.doesNotMatch(fillSource, /applyClientNameToNarrative/);
  assert.doesNotMatch(fillSource, /client name\|client first name\|first name/);
  assert.doesNotMatch(fillSource, /\\bClient/);
  assert.doesNotMatch(fillSource, /\\b\[Tt\]he client/);
});

test('normalization writes objectives and interventions as plain newline-separated text', () => {
  const normalized = context.normalizeTreatmentPlanObject({
    scenario: 'sud_outpatient',
    problems: [{
      objectives: ['1. First objective.', '• Second objective.'],
      therapeutic_interventions: ['- First intervention.', '2) Second intervention.'],
      review_comments: 'To be completed at treatment plan review.'
    }]
  }, 'sud_outpatient').treatment_plan;

  assert.equal(normalized.problems[0].objectives_text, 'First objective.\nSecond objective.');
  assert.equal(normalized.problems[0].therapeutic_interventions_text, 'First intervention.\nSecond intervention.');
  assert.equal(normalized.problems[0].review_comments, '');
});

test('Review/Comments is retained only for higher-level-of-care plans', () => {
  const higherLevel = context.normalizeTreatmentPlanObject({
    scenario: 'higher_level_asam_3_7',
    problems: [{ review_comments: 'Referral to ASAM 3.7 is clinically indicated.' }]
  }, 'higher_level_asam_3_7').treatment_plan;
  const outpatient = context.normalizeTreatmentPlanObject({
    scenario: 'higher_level_asam_3_7',
    problems: [{ review_comments: 'Legacy default text.' }]
  }, 'sud_outpatient').treatment_plan;

  assert.equal(higherLevel.problems[0].review_comments, 'Referral to ASAM 3.7 is clinically indicated.');
  assert.equal(outpatient.scenario, 'sud_outpatient');
  assert.equal(outpatient.problems[0].review_comments, '');
});

test('Completion Date is calculated from the target duration and base date', () => {
  assert.equal(context.treatmentCompletionMonthYear('5–7 days', '07/28/2026'), 'August 2026');
  assert.equal(context.treatmentCompletionMonthYear('7 to 10 days', '2026-07-28'), 'August 2026');
  assert.equal(context.treatmentCompletionMonthYear('10-14 days', 'July 28, 2026'), 'August 2026');
  assert.equal(context.treatmentCompletionMonthYear('90 days', '07/28/2026'), 'October 2026');
  assert.equal(context.treatmentCompletionMonthYear('30 days', '12/15/2026'), 'January 2027');
  assert.equal(context.treatmentCompletionMonthYear('TBD', '07/28/2026'), '');
});

test('normalization replaces BastionGPT Completion Date with the deterministic result', () => {
  const plan = context.normalizeTreatmentPlanObject({
    assessment_date: '07/28/2026',
    problems: [
      { target_date: '5-7 days', completion_date: 'July 2026' },
      { target_date: '90 days', completion_date: '' },
      { target_date: 'TBD', completion_date: 'TBD' }
    ]
  }, 'higher_level_asam_3_7').treatment_plan;

  assert.equal(plan.problems[0].completion_date, 'August 2026');
  assert.equal(plan.problems[1].completion_date, 'October 2026');
  assert.equal(plan.problems[2].completion_date, 'TBD');
});

test('live Treatment Plan map uses captured Service Plan field IDs and excludes read-only controls', () => {
  const helperStart = sidepanelSource.indexOf('function buildTreatmentRuntimeConfig');
  const helperEnd = sidepanelSource.indexOf('function validateQuickNotesResponse');
  const helperContext = {
    workflowMode() {
      return {
        selector: 'textarea, select, input',
        onlyVisibleControls: false
      };
    }
  };
  vm.createContext(helperContext);
  vm.runInContext(sidepanelSource.slice(helperStart, helperEnd), helperContext);

  const runtime = helperContext.buildTreatmentRuntimeConfig();
  assert.equal(runtime.expectedFieldCount, 27);
  assert.equal(runtime.fieldMap.length, 25);
  assert.deepEqual(
    Array.from(runtime.fieldMap, item => item.dataQnFieldId),
    Array.from({ length: 25 }, (_, index) => String(10000 + index))
  );
  assert.equal(runtime.fieldMap[3].paths[0], 'treatment_plan.problems.0.problem_statement');
  assert.equal(runtime.fieldMap[24].paths[0], 'treatment_plan.safety_planning');
  assert.ok(!runtime.fieldMap.some(item => item.treatmentField === 'next_review_date'));
  assert.ok(!runtime.fieldMap.some(item => ['10025', '10026'].includes(item.dataQnFieldId)));
  assert.match(runtime.selector, /#notePanels \.quickNoteFormBlock/);
  assert.notEqual(runtime.selector, 'textarea, select, input');
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
