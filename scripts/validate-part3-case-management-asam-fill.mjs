import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sidepanelPath = path.join(repoRoot, 'extension', 'sidepanel.js');
const workflowPath = path.join(repoRoot, 'github-data', 'rose-reliatrax-workflows-config.json');
const sidepanelSource = fs.readFileSync(sidepanelPath, 'utf8');
const workflowConfig = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const fillStart = sidepanelSource.indexOf('function pageFill(config, merged, dryRun)');
const fillEnd = sidepanelSource.indexOf('function buildRuntimeConfig()', fillStart);
const fillSource = fillStart === -1 || fillEnd === -1
  ? ''
  : sidepanelSource.slice(fillStart, fillEnd);
const asamConstantsStart = sidepanelSource.indexOf('const ASAM_FUNCTIONING_ITEMS');
const asamConstantsEnd = sidepanelSource.indexOf('function setStatus', asamConstantsStart);
const asamFunctionsStart = sidepanelSource.indexOf('function normalizeAsamKey');
const asamFunctionsEnd = sidepanelSource.indexOf("\n$('loadRemote').onclick", asamFunctionsStart);
const asamSupportSource = asamConstantsStart === -1 || asamConstantsEnd === -1 || asamFunctionsStart === -1 || asamFunctionsEnd === -1
  ? ''
  : `${sidepanelSource.slice(asamConstantsStart, asamConstantsEnd)}\n${sidepanelSource.slice(asamFunctionsStart, asamFunctionsEnd)}`;

if (!fillSource) throw new Error('Could not extract pageFill() from extension/sidepanel.js');
if (!asamSupportSource) throw new Error('Could not extract Part 3 ASAM normalizer from extension/sidepanel.js');

function defaultRowsToObject(rows) {
  const obj = {};
  for (const row of rows || []) {
    const parts = String(row.question || '').split('.').filter(Boolean);
    let cur = obj;
    parts.slice(0, -1).forEach(part => {
      cur[part] = cur[part] || {};
      cur = cur[part];
    });
    cur[parts.at(-1)] = row.answer;
  }
  return obj;
}

function fieldHtml(index) {
  if (index === 131 || index === 146) {
    return `<textarea id=\"duplicate_why_${index}\" class=\"qn-textarea\" data-duplicate=\"why\"></textarea>`;
  }
  return `<textarea id=\"pre_${index}\" class=\"qn-textarea\"></textarea>`;
}

const functioningRows = [
  ['housing', 'Housing'],
  ['financial_stressors', 'Financial Stressors'],
  ['legal', 'Legal'],
  ['employment', 'Employment'],
  ['education_vocation', 'Education/Vocation'],
  ['independent_living', 'Independent Living'],
  ['medical', 'Medical'],
  ['social_natural_supports', 'Social/Nat. Supports']
];
const functioningLabels = ['None', 'Mild', 'Moderate', 'Severe'];
const part3Controls = [];
let qnFieldId = 10451;
for (const [key, label] of functioningRows) {
  for (const severity of functioningLabels) {
    part3Controls.push(`<label>${label} ${severity}<input id=\"${key}_${severity.toLowerCase()}\" type=\"checkbox\" class=\"qn-editable-cb\" data-qn-field-id=\"${qnFieldId++}\" checked></label>`);
  }
}
for (let dimension = 1; dimension <= 6; dimension++) {
  part3Controls.push(`<div class=\"qn-editable textarea-wrapper\" data-qn-field-id=\"${qnFieldId++}\"><textarea id=\"dimension_${dimension}\" class=\"qn-textarea\"></textarea></div>`);
}
part3Controls.push(`<div class=\"qn-editable textarea-wrapper\" data-qn-field-id=\"${qnFieldId++}\"><textarea id=\"safety_needed\" class=\"qn-textarea\"></textarea></div>`);
part3Controls.push(`<div class=\"qn-editable textarea-wrapper\" data-qn-field-id=\"${qnFieldId++}\"><textarea id=\"safety_why\" class=\"qn-textarea\"></textarea></div>`);

const html = `<!doctype html>
<html>
<body>
  ${Array.from({ length: 455 }, (_, index) => fieldHtml(index)).join('\\n')}
  <section id=\"part3\">${part3Controls.join('\\n')}</section>
  ${Array.from({ length: 41 }, (_, index) => `<textarea id=\"post_${index}\" class=\"qn-textarea\"></textarea>`).join('\\n')}
</body>
</html>`;

const driftHtml = html.replace(
  '<div class=\"qn-editable textarea-wrapper\" data-qn-field-id=\"10490\"><textarea id=\"safety_why\"',
  '<textarea id=\"unmapped_between_safety_fields\" class=\"qn-textarea\"></textarea>\\n<div class=\"qn-editable textarea-wrapper\" data-qn-field-id=\"10490\"><textarea id=\"safety_why\"'
);

const runtimeConfig = {
  workflowMode: 'asam',
  selector: workflowConfig.modes.asam.selector,
  onlyVisibleControls: workflowConfig.modes.asam.onlyVisibleControls,
  expectedFieldCount: workflowConfig.modes.asam.expectedFieldCount,
  fieldMap: workflowConfig.modes.asam.fieldMap,
  defaultAnswers: workflowConfig.modes.asam.defaultAnswers,
  defaultAnswersObject: defaultRowsToObject(workflowConfig.modes.asam.defaultAnswers)
};

const loganResponse = {
  case_management: {
    items: {
      housing: '3 homeless (Logan is currently homeless and has no stable residence.)',
      financial_stressors: { score: 2, rationale: 'Logan reports financial instability.' },
      legal: { severity: 'Moderate', rationale: 'Logan is on active pretrial supervision.' },
      employment: { rating: 2, rationale: 'Logan is unemployed and seeking work.' },
      education_vocation: { score: 0, severity: 'None', rationale: 'Logan is enrolled in college.' },
      independent_living: { score: 2, rationale: 'Logan needs support due to homelessness.' },
      medical: { score: 1, rationale: 'Logan has medication needs but no acute medical concern.' },
      social_natural_supports: { score: 1, rationale: 'Logan has some family support.' }
    },
    asam_criteria: Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
      const dimension = index + 1;
      const severity = [1, 1, 2, 2, 3, 3][index];
      const label = ['Mild', 'Mild', 'Moderate', 'Moderate', 'High', 'High'][index];
      return [`dimension_${dimension}`, {
        severity,
        label,
        text: `Dimension ${dimension} clinical rationale. Logan's functioning supports this rating, risk implications are described, and the level of care is supported by the ASAM profile.`
      }];
    })),
    safety_planning: {
      additional_safety_planning_needed: 'No',
      why_or_why_not: 'Logan denies SI/HI, self-harm, violence risk, acute withdrawal, acute medical concerns, and psychiatric instability. Relapse and environmental risks are clinically addressed through treatment recommendations and do not require additional safety planning at this time.'
    }
  }
};

const safetyYesResponse = {
  case_management: {
    ...loganResponse.case_management,
    safety_planning: {
      additional_safety_planning_needed: 'Yes',
      why_or_why_not: 'Additional safety planning is needed because the client reports active suicidal ideation and psychiatric instability requiring immediate coping steps, crisis contacts, and emergency follow-up planning.'
    }
  }
};

const promptShapeResponse = {
  case_management: {
    items: loganResponse.case_management.items
  },
  asam_criteria: loganResponse.case_management.asam_criteria,
  safety_planning: loganResponse.case_management.safety_planning,
  assessment_summary: {
    paragraph_1: 'Logan has a substance use history with recent relapse and current environmental instability.',
    paragraph_2: 'The ASAM profile supports structured treatment due to relapse and recovery environment risk.',
    paragraph_3: 'Protective factors include some family support.',
    paragraph_4: 'IOP is the least restrictive clinically appropriate level of care.',
    paragraph_5_optional: ''
  },
  clinical_recommendations: {
    group: { selected: true, rationale: 'Structured SUD group support is clinically appropriate.' },
    individual: { selected: true, rationale: 'Individual support is clinically appropriate.' },
    mental_health: { selected: true, rationale: 'Mental health symptoms are present.' },
    medical: { selected: true, rationale: 'Medication follow up is relevant.' },
    case_management: { selected: true, rationale: 'Housing support is relevant.' },
    peer_coaching: { selected: true, rationale: 'Peer recovery linkage is appropriate.' },
    coordination_with_other_providers: { selected: true, rationale: 'MAT coordination is relevant.' },
    other_services: { selected: true, services: 'housing navigation', rationale: 'Housing instability is present.' }
  },
  dsm_v: {
    sud_diagnoses_only: ['F11.20 Opioid Use Disorder, Severe'],
    diagnostic_rationale: 'Transcript supports opioid use disorder.'
  },
  level_of_care: {
    recommended_level: 'IOP 2.1',
    asam_rationale: 'ASAM dimensions support IOP.',
    why_lower_level_is_not_indicated: 'Lower care is insufficient due to relapse risk.',
    why_higher_level_is_not_indicated: 'Higher care is not required due to no acute instability.',
    estimated_length_of_time_at_this_level: '90 days',
    estimated_date_of_discharge: 'August 2026'
  },
  quality_check: {
    case_management_asam_alignment_confirmed: true,
    asam_dsm_alignment_confirmed: true,
    asam_level_of_care_alignment_confirmed: true,
    safety_planning_alignment_confirmed: true,
    dimension_3_calibration_confirmed: true,
    notes: ''
  }
};

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];

async function runScenario(response, content = html) {
  await page.setContent(content, { waitUntil: 'domcontentloaded' });
  return page.evaluate(
    ({ fillSource, asamSupportSource, runtimeConfig, response }) => {
      // eslint-disable-next-line no-eval
      eval(`${asamSupportSource}\n${fillSource}`);
      const normalized = normalizeAsamResponseForFill(response);
      return pageFill(runtimeConfig, normalized, false);
    },
    { fillSource, asamSupportSource, runtimeConfig, response }
  );
}

const result = await runScenario(loganResponse);
const state = await page.evaluate(({ rows, labels }) => {
  const checkboxRows = Object.fromEntries(rows.map(([key]) => [
    key,
    Object.fromEntries(labels.map(label => [label, document.querySelector(`#${key}_${label.toLowerCase()}`).checked]))
  ]));
  return {
    checkboxRows,
    dimensions: Array.from({ length: 6 }, (_, index) => document.querySelector(`#dimension_${index + 1}`).value),
    safetyNeeded: document.querySelector('#safety_needed').value,
    safetyWhy: document.querySelector('#safety_why').value,
    duplicateWhy131: document.querySelector('#duplicate_why_131').value,
    duplicateWhy146: document.querySelector('#duplicate_why_146').value,
    fieldCount: document.querySelectorAll('textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), [contenteditable="true"]').length
  };
}, { rows: functioningRows, labels: functioningLabels });

const expectedScores = {
  housing: 'Severe',
  financial_stressors: 'Moderate',
  legal: 'Moderate',
  employment: 'Moderate',
  education_vocation: 'None',
  independent_living: 'Moderate',
  medical: 'Mild',
  social_natural_supports: 'Mild'
};

if (result?.error) failures.push(result.error);
if (state.fieldCount !== 536) failures.push(`expected 536 controls in Part 3 fixture, found ${state.fieldCount}`);
for (const [key, expected] of Object.entries(expectedScores)) {
  const selected = Object.entries(state.checkboxRows[key]).filter(([, checked]) => checked).map(([label]) => label);
  if (selected.length !== 1 || selected[0] !== expected) {
    failures.push(`${key} expected exactly ${expected}, found ${selected.join(', ') || 'none'}`);
  }
}
state.dimensions.forEach((text, index) => {
  const dimension = index + 1;
  if (!text.includes(`Severity: ${[1, 1, 2, 2, 3, 3][index]}:`)) failures.push(`Dimension ${dimension} severity was not written`);
  if (!/functioning/i.test(text) || !/risk/i.test(text) || !/level of care/i.test(text)) failures.push(`Dimension ${dimension} missing functioning, risk, or level-of-care text`);
});
if (state.safetyNeeded !== 'No') failures.push(`Safety needed expected No, found ${state.safetyNeeded}`);
if (state.safetyWhy !== 'Logan denies being a suicide risk') {
  failures.push(`Safety why/no rationale expected exact denial wording, found ${state.safetyWhy}`);
}
if (state.duplicateWhy131 || state.duplicateWhy146) failures.push('Earlier duplicate Why or why not fields were incorrectly written');

const yesResult = await runScenario(safetyYesResponse);
const yesState = await page.evaluate(() => ({
  safetyNeeded: document.querySelector('#safety_needed').value,
  safetyWhy: document.querySelector('#safety_why').value
}));
if (yesResult?.error) failures.push(yesResult.error);
if (yesState.safetyNeeded !== 'Yes') failures.push(`Safety needed expected Yes, found ${yesState.safetyNeeded}`);
if (!/suicidal ideation|psychiatric instability|crisis/i.test(yesState.safetyWhy)) failures.push('Safety yes rationale was not written with active risk details');

const promptShapeResult = await runScenario(promptShapeResponse);
const promptShapeState = await page.evaluate(() => ({
  housingSevere: document.querySelector('#housing_severe').checked,
  dimension3: document.querySelector('#dimension_3').value,
  safetyNeeded: document.querySelector('#safety_needed').value,
  safetyWhy: document.querySelector('#safety_why').value
}));
if (promptShapeResult?.error) failures.push(promptShapeResult.error);
if (!promptShapeState.housingSevere) failures.push('Prompt-shaped response did not select Housing Severe');
if (!/Severity: 2: Moderate/.test(promptShapeState.dimension3)) failures.push('Prompt-shaped response did not normalize top-level ASAM dimension 3');
if (promptShapeState.safetyNeeded !== 'No') failures.push(`Prompt-shaped response safety needed expected No, found ${promptShapeState.safetyNeeded}`);
if (promptShapeState.safetyWhy !== 'Logan denies being a suicide risk') {
  failures.push(`Prompt-shaped response safety why expected exact denial wording, found ${promptShapeState.safetyWhy}`);
}

const driftResult = await runScenario(loganResponse, driftHtml);
const driftState = await page.evaluate(() => ({
  safetyNeeded: document.querySelector('#safety_needed').value,
  unmappedBetweenSafetyFields: document.querySelector('#unmapped_between_safety_fields').value,
  safetyWhy: document.querySelector('#safety_why').value
}));
if (driftResult?.error) failures.push(driftResult.error);
if (driftState.safetyNeeded !== 'No') failures.push(`Drift fixture safety needed expected No, found ${driftState.safetyNeeded}`);
if (driftState.unmappedBetweenSafetyFields) failures.push('Drift fixture wrote Why or why not text into an unmapped intervening textarea');
if (driftState.safetyWhy !== 'Logan denies being a suicide risk') failures.push(`Drift fixture safety why expected exact denial wording, found ${driftState.safetyWhy}`);

await browser.close();

const summarizeResult = (value) => value ? {
  event: value.event,
  found: value.found,
  expected: value.expected,
  written: value.written,
  responseWritten: value.responseWritten,
  checkboxWritten: value.checkboxWritten,
  checkboxTrueWritten: value.checkboxTrueWritten,
  checkboxFalseWritten: value.checkboxFalseWritten,
  checkboxWriteFailures: value.checkboxWriteFailures,
  skipped: value.skipped,
  missing: value.missing,
  warnings: value.warnings
} : value;

console.log(JSON.stringify({
  state,
  yesState,
  promptShapeState,
  driftState,
  result: summarizeResult(result),
  yesResult: summarizeResult(yesResult),
  promptShapeResult: summarizeResult(promptShapeResult),
  driftResult: summarizeResult(driftResult),
  failures
}, null, 2));
if (failures.length) process.exit(1);
