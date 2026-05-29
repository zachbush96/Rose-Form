import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(repoRoot, 'extension', 'default-config.js');
const sidepanelPath = path.join(repoRoot, 'extension', 'sidepanel.js');
const savedFormPath = path.join(repoRoot, 'fixtures', 'bps', 'saved form.html');
const exampleJsonPath = path.join(repoRoot, 'fixtures', 'responses', 'example_JSON.json');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
const config = context.window.DEFAULT_ROSE_BPS_CONFIG;
const exampleJson = JSON.parse(fs.readFileSync(exampleJsonPath, 'utf8'));
exampleJson.substance_use.substance_3 = {
  substance: '',
  age_first_use: '',
  amount_used: '',
  frequency_used: '',
  tolerance: '',
  method: '',
  last_use_date: '',
  days_used_last_30: '',
  recent_pattern: '',
  behavioral_changes: '',
  consequences: '',
  sees_use_as_problem: '',
  tried_to_quit: '',
  sober_duration: ''
};
exampleJson.vocational = { highest_education: '10th grade' };
exampleJson.current = { marital_status: 'single', children_count: '0' };
const sidepanelSource = fs.readFileSync(sidepanelPath, 'utf8');
const pageFillStart = sidepanelSource.indexOf('function pageFill(config, merged, dryRun)');
const pageFillEnd = sidepanelSource.indexOf('function buildRuntimeConfig()', pageFillStart);
const pageFillSource = pageFillStart === -1 || pageFillEnd === -1
  ? ''
  : sidepanelSource.slice(pageFillStart, pageFillEnd);

if (!pageFillSource) {
  throw new Error('Could not extract pageFill() from extension/sidepanel.js');
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(savedFormPath).href);

const result = await page.evaluate(
  ({ config, exampleJson, pageFillSource }) => {
    // Evaluate the exact extension fill routine against the saved ReliaTrax DOM.
    // eslint-disable-next-line no-eval
    eval(pageFillSource);
    return pageFill(config, exampleJson, false);
  },
  { config, exampleJson, pageFillSource }
);

const snapshot = await page.evaluate(() => {
  const fields = [...document.querySelectorAll('textarea.qn-textarea, input.qn-editable-cb')];
  const field = (index) => {
    const el = fields[index];
    if (!el) return undefined;
    return (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : el.value;
  };
  return {
    found: fields.length,
    currentLivingLocation: field(2),
    referralSource: field(0),
    substanceOneAgeFirstUse: field(5),
    substanceOneAmountUsed: field(6),
    substanceOneProblemYes: field(15),
    substanceOneProblemNo: field(16),
    substanceOneLastUse: field(10),
    substanceTwoAgeFirstUse: field(20),
    substanceThreeExtraNotes: field(45),
    tobaccoUsesYes: field(53),
    tobaccoUsesNo: field(54),
    tobaccoWantsQuitYes: field(60),
    tobaccoWantsQuitNo: field(61),
    withdrawalExperiencedYes: field(64),
    withdrawalExperiencedNo: field(65),
    withdrawalSeizureYes: field(67),
    withdrawalSeizureNo: field(68),
    diagnosedBy: field(83),
    notInterestedResources: field(95),
    safeSexYes: field(215),
    safeSexNo: field(216),
    safeSexSometimes: field(217),
    partnersLastYear: field(218),
    paidForSexNever: field(223),
    medicationOneName: field(194),
    medicationOneDosage: field(195),
    medicationOneSideEffects: field(196),
    medicationOneCurrentlyTakingYes: field(197),
    medicationOneCurrentlyTakingNo: field(198),
    medicationOneMixedYes: field(199),
    medicationOneMixedNo: field(200),
    medicationTwoName: field(201),
    medicationTwoDosage: field(202),
    medicationTwoSideEffects: field(203),
    medicationTwoCurrentlyTakingYes: field(204),
    medicationTwoCurrentlyTakingNo: field(205),
    medicationTwoMixedYes: field(206),
    medicationTwoMixedNo: field(207),
    medicationThreeName: field(208),
    medicationThreeDosage: field(209),
    medicationThreeSideEffects: field(210),
    medicationThreeCurrentlyTakingYes: field(211),
    medicationThreeCurrentlyTakingNo: field(212),
    medicationThreeMixedYes: field(213),
    medicationThreeMixedNo: field(214),
    personsOnIncome: field(235),
    militaryRank: field(244),
    educationLevel: field(238),
    maritalStatus: field(247)
  };
});

const nestedMedicationJson = JSON.parse(JSON.stringify(exampleJson));
delete nestedMedicationJson.medications;
nestedMedicationJson.medical = nestedMedicationJson.medical || {};
nestedMedicationJson.medical.medications = {
  medication_1: {
    name: 'Methadone',
    dosage_frequency: '105 mg daily',
    side_effects: 'None reported',
    currently_taking: { yes: true, no: false },
    mixed_with_alcohol_or_drugs: { yes: false, no: false }
  },
  medication_2: {
    name: 'Gabapentin',
    dosage_frequency: 'Unknown',
    side_effects: 'None reported',
    currently_taking: { yes: true, no: false },
    mixed_with_alcohol_or_drugs: { yes: false, no: false }
  },
  medication_3: {
    name: 'Trazodone',
    dosage_frequency: 'Unknown',
    side_effects: 'None reported',
    currently_taking: { yes: true, no: false },
    mixed_with_alcohol_or_drugs: { yes: false, no: false }
  }
};
nestedMedicationJson.mental_health = {
  no_history: true,
  diagnosis_history: '',
  age_diagnosed: '',
  diagnosed_by: '',
  agrees_with_diagnosis: { yes: false, no: false },
  using_substances_at_diagnosis: '',
  substance_use_impacted_diagnosis: ''
};

const nestedPage = await browser.newPage();
await nestedPage.goto(pathToFileURL(savedFormPath).href);
const nestedResult = await nestedPage.evaluate(
  ({ config, nestedMedicationJson, pageFillSource }) => {
    // eslint-disable-next-line no-eval
    eval(pageFillSource);
    return pageFill(config, nestedMedicationJson, false);
  },
  { config, nestedMedicationJson, pageFillSource }
);
const nestedSnapshot = await nestedPage.evaluate(() => {
  const fields = [...document.querySelectorAll('textarea.qn-textarea, input.qn-editable-cb')];
  const field = (index) => {
    const el = fields[index];
    if (!el) return undefined;
    return (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : el.value;
  };
  return {
    diagnosisHistory: field(81),
    diagnosisAge: field(82),
    usingSubstancesAtDiagnosis: field(86),
    substanceUseImpactedDiagnosis: field(87),
    medicationOneName: field(194),
    medicationOneDosage: field(195),
    medicationOneCurrentlyTakingYes: field(197),
    medicationTwoName: field(201),
    medicationThreeName: field(208)
  };
});

await browser.close();

const failures = [];
if (result.found !== 264) failures.push(`expected 264 fields, found ${result.found}`);
if (result.missing?.length) failures.push(`missing mapped fields: ${result.missing.length}`);
if (result.warnings?.length) failures.push(`unexpected warnings: ${result.warnings.join('; ')}`);
if (snapshot.referralSource !== 'Self-referral') failures.push('default referral source was not written');
if (snapshot.currentLivingLocation !== 'Bridge House') failures.push('living location was not written');
if (snapshot.substanceOneAgeFirstUse !== 'fentanyl\n\nAge of first use: early 30s') failures.push('substance 1 name and age were not combined');
if (snapshot.substanceOneAmountUsed !== 'Daily use at peak.') failures.push('substance amount default was not written');
if (snapshot.substanceOneProblemYes !== true || snapshot.substanceOneProblemNo !== false) failures.push('substance problem default checkbox state is wrong');
if (snapshot.substanceOneLastUse !== 'a few months ago') failures.push('substance 1 last use was not written');
if (snapshot.substanceTwoAgeFirstUse !== 'methamphetamine\n\nAge of first use: 15') failures.push('substance 2 name and age were not combined');
if (snapshot.substanceThreeExtraNotes !== 'n/a') failures.push('unused substance 3 field did not get n/a');
if (snapshot.tobaccoUsesYes !== true || snapshot.tobaccoUsesNo !== false) failures.push('tobacco yes/no checkbox state is wrong');
if (snapshot.tobaccoWantsQuitYes !== true || snapshot.tobaccoWantsQuitNo !== false) failures.push('quit-now yes/no checkbox state is wrong');
if (snapshot.withdrawalExperiencedYes !== true || snapshot.withdrawalExperiencedNo !== false) failures.push('withdrawal yes/no checkbox state is wrong');
if (snapshot.withdrawalSeizureYes !== false || snapshot.withdrawalSeizureNo !== true) failures.push('withdrawal seizure yes/no checkbox state is wrong');
if (snapshot.diagnosedBy !== 'Unknown') failures.push('diagnosed-by default was not written');
if (snapshot.notInterestedResources !== false) failures.push('not-interested resources checkbox should remain unchecked');
if (snapshot.safeSexYes !== true || snapshot.safeSexNo !== false || snapshot.safeSexSometimes !== false) failures.push('safe-sex default checkbox state is wrong');
if (snapshot.partnersLastYear !== 'Information not provided') failures.push('sexual partners default was not written');
if (snapshot.paidForSexNever !== true) failures.push('non-yes/no paid-for-sex checkbox default was not written');
for (const slot of ['One', 'Two', 'Three']) {
  if (snapshot[`medication${slot}Name`] !== 'n/a') failures.push(`empty medication ${slot.toLowerCase()} name did not get n/a`);
  if (snapshot[`medication${slot}Dosage`] !== 'n/a') failures.push(`empty medication ${slot.toLowerCase()} dosage did not get n/a`);
  if (snapshot[`medication${slot}SideEffects`] !== 'n/a') failures.push(`empty medication ${slot.toLowerCase()} side effects did not get n/a`);
  if (snapshot[`medication${slot}CurrentlyTakingYes`] !== false || snapshot[`medication${slot}CurrentlyTakingNo`] !== false) {
    failures.push(`empty medication ${slot.toLowerCase()} currently-taking checkboxes should both be unchecked`);
  }
  if (snapshot[`medication${slot}MixedYes`] !== false || snapshot[`medication${slot}MixedNo`] !== false) {
    failures.push(`empty medication ${slot.toLowerCase()} mixed-with-alcohol-or-drugs checkboxes should both be unchecked`);
  }
}
if (snapshot.personsOnIncome !== 'Self') failures.push('income support default was not written');
if (snapshot.militaryRank !== 'n/a') failures.push('military n/a default was not written');
if (snapshot.educationLevel !== '10th grade') failures.push('Prompt 4 highest education alias was not written');
if (snapshot.maritalStatus !== 'single') failures.push('Prompt 4 marital status alias was not written');
if (!nestedResult.warnings?.some(warning => warning.includes('medical.medications'))) {
  failures.push('nested medical.medications shape did not produce a normalization warning');
}
if (nestedSnapshot.diagnosisHistory !== 'n/a') failures.push('mental-health no-history diagnosis did not default to n/a');
if (nestedSnapshot.diagnosisAge !== 'n/a') failures.push('mental-health no-history diagnosis age did not default to n/a');
if (nestedSnapshot.usingSubstancesAtDiagnosis !== 'n/a') failures.push('mental-health no-history substance-at-diagnosis did not default to n/a');
if (nestedSnapshot.substanceUseImpactedDiagnosis !== 'n/a') failures.push('mental-health no-history impact field did not default to n/a');
if (nestedSnapshot.medicationOneName !== 'Methadone') failures.push('nested medication 1 name was not normalized and written');
if (nestedSnapshot.medicationOneDosage !== '105 mg daily') failures.push('nested medication 1 dosage was not normalized and written');
if (nestedSnapshot.medicationOneCurrentlyTakingYes !== true) failures.push('nested medication currently-taking checkbox was not written');
if (nestedSnapshot.medicationTwoName !== 'Gabapentin') failures.push('nested medication 2 name was not normalized and written');
if (nestedSnapshot.medicationThreeName !== 'Trazodone') failures.push('nested medication 3 name was not normalized and written');

console.log(JSON.stringify({
  summary: {
    found: result.found,
    expected: result.expected,
    written: result.written,
    responseWritten: result.responseWritten,
    defaultWritten: result.defaultWritten,
    checkboxWritten: result.checkboxWritten,
    checkboxTrueWritten: result.checkboxTrueWritten,
    checkboxFalseWritten: result.checkboxFalseWritten,
    checkboxWriteFailures: result.checkboxWriteFailures,
    skipped: result.skipped,
    missingCount: result.missing?.length || 0,
    warnings: result.warnings
  },
  nestedSummary: {
    written: nestedResult.written,
    responseWritten: nestedResult.responseWritten,
    defaultWritten: nestedResult.defaultWritten,
    warnings: nestedResult.warnings
  },
  snapshot,
  nestedSnapshot,
  failures
}, null, 2));
if (failures.length) process.exit(1);
