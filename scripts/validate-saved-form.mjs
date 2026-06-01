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
    substanceThreeSubstance: field(35),
    substanceThreeAgeFirstUse: field(36),
    substanceThreeConsequences: field(45),
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
    noMentalHealthHistory: field(80),
    diagnosisHistory: field(81),
    diagnosisAge: field(82),
    diagnosedBy: field(83),
    usingSubstancesAtDiagnosis: field(86),
    substanceUseImpactedDiagnosis: field(87),
    medicationOneName: field(194),
    medicationOneDosage: field(195),
    medicationOneCurrentlyTakingYes: field(197),
    medicationTwoName: field(201),
    medicationThreeName: field(208)
  };
});

const partOneRulesJson = {
  legal: {
    lifetime_arrest_count: 'Client reports an estimated 15 to 30 lifetime arrests.'
  },
  substance_use: {
    substance_3: {
      age_first_use: 'Substance: Cannabis Age of first use: 14',
      amount_used: 'about 1 gram',
      frequency_used: 'weekly',
      tolerance: '',
      method: 'smoking',
      last_use_date: 'two weeks ago',
      days_used_last_30: 'Estimated 2 days in the last 30',
      recent_pattern: 'Cruz reports intermittent cannabis use.',
      behavioral_changes: 'Client reports reduced motivation when using cannabis.',
      consequences: 'Client reports cannabis use has impacted motivation.',
      sees_use_as_problem: { yes: true, no: false },
      tried_to_quit: { yes: true, no: false },
      sober_duration: 'Cruz reports his longest sobriety from cannabis was one month.'
    }
  },
  tobacco: {
    uses_tobacco_or_vapes: { yes: true, no: false },
    amount_and_frequency: 'Information not provided'
  },
  mental_health: {
    no_history: false,
    diagnosis_history: 'n/a',
    age_diagnosed: '',
    diagnosed_by: 'Unknown',
    agrees_with_diagnosis: { yes: false, no: false },
    using_substances_at_diagnosis: '',
    substance_use_impacted_diagnosis: ''
  },
  mental_health_treatment: {
    currently_working_with_psychiatrist: { yes: false, no: true },
    currently_working_with_therapist: { yes: false, no: true },
    mental_health_professionals_contact: 'Information not provided'
  },
  medical: {
    has_primary_care: 'Yes',
    primary_care_clinic_or_doctor: 'Information not provided',
    primary_care_doctor_name: '',
    dental_problems: { yes: false, no: true },
    dentist_next_plan: 'n/a'
  },
  medications: {
    medication_1: {
      name: 'Suboxone',
      dosage_frequency: '',
      side_effects: '',
      currently_taking: { yes: true, no: false },
      mixed_with_alcohol_or_drugs: { yes: false, no: false }
    }
  },
  spiritual_cultural: {
    religion_affiliation: 'Information not provided',
    active_in_religion: 'Information not provided'
  },
  sexual_history: {
    tested_std_hepatitis_hiv: { yes: true, no: false },
    wants_sexual_health_resources_if_no: { yes: false, no: false }
  }
};

const partOnePage = await browser.newPage();
await partOnePage.goto(pathToFileURL(savedFormPath).href);
const partOneResult = await partOnePage.evaluate(
  ({ config, partOneRulesJson, pageFillSource }) => {
    // eslint-disable-next-line no-eval
    eval(pageFillSource);
    return pageFill(config, partOneRulesJson, false);
  },
  { config, partOneRulesJson, pageFillSource }
);
const partOneSnapshot = await partOnePage.evaluate(() => {
  const fields = [...document.querySelectorAll('textarea.qn-textarea, input.qn-editable-cb')];
  const field = (index) => {
    const el = fields[index];
    if (!el) return undefined;
    return (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : el.value;
  };
  return {
    substanceThreeSubstance: field(35),
    substanceThreeAgeFirstUse: field(36),
    substanceThreeAmountUsed: field(37),
    substanceThreeFrequencyUsed: field(38),
    substanceThreeTolerance: field(39),
    substanceThreeMethod: field(40),
    substanceThreeLastUse: field(41),
    substanceThreeDaysLast30: field(42),
    substanceThreeRecentPattern: field(43),
    substanceThreeBehavioralChanges: field(44),
    substanceThreeConsequences: field(45),
    legalLifetimeArrests: field(143),
    noMentalHealthHistory: field(80),
    diagnosisHistory: field(81),
    diagnosisAge: field(82),
    diagnosedBy: field(83),
    usingSubstancesAtDiagnosis: field(86),
    substanceUseImpactedDiagnosis: field(87),
    psychiatristNo: field(91),
    therapistNo: field(93),
    professionalsContact: field(94),
    pcpClinic: field(182),
    pcpDoctor: field(183),
    dentistNextPlan: field(193),
    medicationOneMixedYes: field(199),
    medicationOneMixedNo: field(200),
    religionAffiliation: field(167),
    activeInReligion: field(168),
    tobaccoAmountFrequency: field(57),
    sexualResourcesYes: field(227),
    sexualResourcesNo: field(228)
  };
});

const threeSubstancePromptJson = {
  client: { first_name: 'Riley' },
  substance_use: {
    substance_1: {
      age_first_use: 'Cocaine: 16 years old'
    },
    substance_2: {
      age_first_use: 'Alcohol: 14 years old'
    },
    substance_3: {
      substance: 'Cannabis',
      age_first_use: '12 years old',
      amount_used: 'weekend use'
    }
  }
};

const threeSubstancePage = await browser.newPage();
await threeSubstancePage.goto(pathToFileURL(savedFormPath).href);
const threeSubstanceResult = await threeSubstancePage.evaluate(
  ({ config, threeSubstancePromptJson, pageFillSource }) => {
    // eslint-disable-next-line no-eval
    eval(pageFillSource);
    return pageFill(config, threeSubstancePromptJson, false);
  },
  { config, threeSubstancePromptJson, pageFillSource }
);
const threeSubstanceSnapshot = await threeSubstancePage.evaluate(() => {
  const fields = [...document.querySelectorAll('textarea.qn-textarea, input.qn-editable-cb')];
  const field = (index) => {
    const el = fields[index];
    if (!el) return undefined;
    return (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : el.value;
  };
  return {
    substanceOneAgeFirstUse: field(5),
    substanceTwoAgeFirstUse: field(20),
    substanceThreeSubstance: field(35),
    substanceThreeAgeFirstUse: field(36),
    substanceThreeAmountUsed: field(37)
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
if (snapshot.substanceThreeSubstance !== 'n/a') failures.push('unused substance 3 substance field did not get n/a');
if (snapshot.substanceThreeAgeFirstUse !== 'n/a') failures.push('unused substance 3 age field did not get n/a');
if (snapshot.substanceThreeConsequences !== 'n/a') failures.push('unused substance 3 consequences field did not get n/a');
if (snapshot.tobaccoUsesYes !== true || snapshot.tobaccoUsesNo !== false) failures.push('tobacco yes/no checkbox state is wrong');
if (snapshot.tobaccoWantsQuitYes !== true || snapshot.tobaccoWantsQuitNo !== false) failures.push('quit-now yes/no checkbox state is wrong');
if (snapshot.withdrawalExperiencedYes !== true || snapshot.withdrawalExperiencedNo !== false) failures.push('withdrawal yes/no checkbox state is wrong');
if (snapshot.withdrawalSeizureYes !== false || snapshot.withdrawalSeizureNo !== true) failures.push('withdrawal seizure yes/no checkbox state is wrong');
if (snapshot.diagnosedBy !== 'n/a') failures.push('diagnosed-by should default to n/a when no mental-health diagnosis history is inferred');
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
if (nestedSnapshot.noMentalHealthHistory !== true) failures.push('mental-health no-history checkbox was not checked');
if (nestedSnapshot.diagnosisHistory !== 'Cruz reports no history of mental health diagnosis.') failures.push('mental-health no-history diagnosis did not use the requested narrative');
if (nestedSnapshot.diagnosisAge !== 'n/a') failures.push('mental-health no-history diagnosis age did not default to n/a');
if (nestedSnapshot.diagnosedBy !== 'n/a') failures.push('mental-health no-history diagnosed-by field did not default to n/a');
if (nestedSnapshot.usingSubstancesAtDiagnosis !== 'n/a') failures.push('mental-health no-history substance-at-diagnosis did not default to n/a');
if (nestedSnapshot.substanceUseImpactedDiagnosis !== 'n/a') failures.push('mental-health no-history impact field did not default to n/a');
if (nestedSnapshot.medicationOneName !== 'Methadone') failures.push('nested medication 1 name was not normalized and written');
if (nestedSnapshot.medicationOneDosage !== '105 mg daily') failures.push('nested medication 1 dosage was not normalized and written');
if (nestedSnapshot.medicationOneCurrentlyTakingYes !== true) failures.push('nested medication currently-taking checkbox was not written');
if (nestedSnapshot.medicationTwoName !== 'Gabapentin') failures.push('nested medication 2 name was not normalized and written');
if (nestedSnapshot.medicationThreeName !== 'Trazodone') failures.push('nested medication 3 name was not normalized and written');
if (partOneResult.found !== 264) failures.push(`part-one rules expected 264 fields, found ${partOneResult.found}`);
if (partOneResult.missing?.length) failures.push(`part-one rules missing mapped fields: ${partOneResult.missing.length}`);
if (partOneSnapshot.substanceThreeSubstance !== 'Cannabis') failures.push('Substance 3 separate substance field was not written');
if (partOneSnapshot.substanceThreeAgeFirstUse !== '14') failures.push('Substance 3 age was not shifted into the age field');
if (partOneSnapshot.substanceThreeAmountUsed !== 'about 1 gram') failures.push('Substance 3 amount was not shifted correctly');
if (partOneSnapshot.substanceThreeFrequencyUsed !== 'weekly') failures.push('Substance 3 frequency was not shifted correctly');
if (partOneSnapshot.substanceThreeTolerance !== 'yes') failures.push('Substance 3 tolerance default was not written at the corrected field');
if (partOneSnapshot.substanceThreeMethod !== 'smoking') failures.push('Substance 3 method was not shifted correctly');
if (partOneSnapshot.substanceThreeLastUse !== 'two weeks ago') failures.push('Substance 3 last-use date was not shifted correctly');
if (partOneSnapshot.substanceThreeDaysLast30 !== 'Estimated 2 days in the last 30') failures.push('Substance 3 days-last-30 was not shifted correctly');
if (partOneSnapshot.substanceThreeRecentPattern !== 'Cruz reports intermittent cannabis use.') failures.push('Substance 3 recent pattern was not written');
if (partOneSnapshot.substanceThreeBehavioralChanges !== 'Cruz reports reduced motivation when using cannabis.') failures.push('Client-name replacement did not apply to Substance 3 behavioral changes');
if (partOneSnapshot.substanceThreeConsequences !== 'Cruz reports cannabis use has impacted motivation.') failures.push('Client-name replacement did not apply to Substance 3 consequences');
if (partOneSnapshot.legalLifetimeArrests !== 'Cruz reports an estimated 15 to 30 lifetime arrests.') failures.push('generic Client narrative was not replaced with the client first name');
if (partOneSnapshot.noMentalHealthHistory !== true) failures.push('no mental-health history checkbox was not auto-selected');
if (partOneSnapshot.diagnosisHistory !== 'Cruz reports no history of mental health diagnosis.') failures.push('no-history mental-health diagnosis narrative was not written');
if (partOneSnapshot.diagnosisAge !== 'n/a' || partOneSnapshot.diagnosedBy !== 'n/a' || partOneSnapshot.usingSubstancesAtDiagnosis !== 'n/a' || partOneSnapshot.substanceUseImpactedDiagnosis !== 'n/a') {
  failures.push('mental-health diagnosis follow-ups did not default to n/a for no diagnosis history');
}
if (partOneSnapshot.psychiatristNo !== true || partOneSnapshot.therapistNo !== true || partOneSnapshot.professionalsContact !== 'n/a') {
  failures.push('mental-health provider contact did not default to n/a when not working with providers');
}
if (partOneSnapshot.pcpClinic !== 'Unknown by client' || partOneSnapshot.pcpDoctor !== 'Unknown by client') {
  failures.push('PCP unknown provider fields did not write Unknown by client');
}
if (partOneSnapshot.dentistNextPlan !== 'Cruz reports no dental problems or plans to see a dentist at this time.') {
  failures.push('dentist no-problems default narrative was not written');
}
if (partOneSnapshot.medicationOneMixedYes !== false || partOneSnapshot.medicationOneMixedNo !== true) {
  failures.push('reported medication did not default mixed-with-alcohol-or-drugs to No');
}
if (partOneSnapshot.religionAffiliation !== 'No' || partOneSnapshot.activeInReligion !== 'n/a') {
  failures.push('missing religion did not default to No with n/a follow-up');
}
if (partOneSnapshot.tobaccoAmountFrequency !== 'Cruz reports cigarette and vaping use.') {
  failures.push('tobacco/vape yes without type did not write the requested default narrative');
}
if (partOneSnapshot.sexualResourcesYes !== false || partOneSnapshot.sexualResourcesNo !== true) {
  failures.push('STD/HIV tested yes did not default resources question to No');
}
if (threeSubstanceResult.found !== 264) failures.push(`three-substance prompt expected 264 fields, found ${threeSubstanceResult.found}`);
if (threeSubstanceResult.missing?.length) failures.push(`three-substance prompt missing mapped fields: ${threeSubstanceResult.missing.length}`);
if (threeSubstanceResult.warnings?.length) failures.push(`three-substance prompt produced unexpected warnings: ${threeSubstanceResult.warnings.join('; ')}`);
if (threeSubstanceSnapshot.substanceOneAgeFirstUse !== 'Cocaine: 16 years old') failures.push('Substance 1 combined prompt value was not preserved');
if (threeSubstanceSnapshot.substanceTwoAgeFirstUse !== 'Alcohol: 14 years old') failures.push('Substance 2 combined prompt value was not preserved');
if (threeSubstanceSnapshot.substanceThreeSubstance !== 'Cannabis') failures.push('Substance 3 separate prompt substance was not written');
if (threeSubstanceSnapshot.substanceThreeAgeFirstUse !== '12 years old') failures.push('Substance 3 separate prompt age was not written');
if (threeSubstanceSnapshot.substanceThreeAmountUsed !== 'weekend use') failures.push('Substance 3 amount shifted away from the corrected field');

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
  partOneSummary: {
    written: partOneResult.written,
    responseWritten: partOneResult.responseWritten,
    defaultWritten: partOneResult.defaultWritten,
    warnings: partOneResult.warnings
  },
  threeSubstanceSummary: {
    written: threeSubstanceResult.written,
    responseWritten: threeSubstanceResult.responseWritten,
    defaultWritten: threeSubstanceResult.defaultWritten,
    warnings: threeSubstanceResult.warnings
  },
  snapshot,
  nestedSnapshot,
  partOneSnapshot,
  threeSubstanceSnapshot,
  failures
}, null, 2));
if (failures.length) process.exit(1);
