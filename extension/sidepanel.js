
const STORAGE_KEYS = {
  config: 'roseBpsConfig',
  configUrl: 'roseBpsConfigUrl',
  responses: 'roseBpsResponses',
  merged: 'roseBpsMerged',
  defaultRows: 'roseBpsDefaultRows',
  traceLog: 'roseBpsTraceLog',
  mode: 'roseBpsActiveMode',
  workflowConfig: 'roseWorkflowConfig',
  treatmentConfig: 'roseTreatmentConfig',
  quicknotesConfig: 'roseQuickNotesConfig',
  discoveryReport: 'roseBpsDiscoveryReport',
  discoveryPrefix: 'roseBpsDiscoveryPrefix',
  quicknotesResponse: 'roseQuickNotesResponse',
  mseResponse: 'roseMseResponse',
  asamResponse: 'roseAsamResponse',
  diagnosticsResponse: 'roseDiagnosticsResponse',
  diagnosticsPromptNote: 'roseDiagnosticsPromptNote',
  treatmentResponse: 'roseTreatmentResponse',
  treatmentScenario: 'roseTreatmentScenario',
  treatmentSupportBundle: 'roseTreatmentSupportBundle'
};

const CONFIG_REPO_DATA_DIR = 'github-data';
const CONFIG_FILE_RE = /(rose-reliatrax-bps-config\.json|rose-reliatrax-workflows-config\.json|rose-quicknotes-config\.json)$/;
const CONFIG_REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/zachbush96/Rose-Form/main/github-data/';
const DEFAULT_REMOTE_CONFIG_URL = `${CONFIG_REPO_RAW_BASE_URL}rose-reliatrax-bps-config.json`;
const DEFAULT_WORKFLOW_CONFIG_URL = `${CONFIG_REPO_RAW_BASE_URL}rose-reliatrax-workflows-config.json`;
const DEFAULT_TREATMENT_CONFIG_URL = `${CONFIG_REPO_RAW_BASE_URL}rose-treatment-plan-config.json`;
const REMOTE_CONFIG_TIMEOUT_MS = 10000;
const N8N_LOGGING_CONFIG = window.ROSE_N8N_LOGGING_CONFIG || {};

const BPS_SUICIDE_ATTEMPT_MAPPING = [
  { fillIndex: 114, dataQnFieldId: '10114', path: 'symptoms_suicide_self_harm.attempt_dates_and_methods' },
  { fillIndex: 115, dataQnFieldId: '10115', path: 'symptoms_suicide_self_harm.under_influence_during_attempts' },
  { fillIndex: 116, dataQnFieldId: '10116', path: 'symptoms_suicide_self_harm.feelings_about_past_attempts' },
  { fillIndex: 117, dataQnFieldId: '10117', path: 'symptoms_suicide_self_harm.protective_factors' },
  { fillIndex: 118, dataQnFieldId: '10118', path: 'symptoms_suicide_self_harm.future_attempt_triggers' }
];

function configVersionParts(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d+)*$/.test(text)) return null;
  return text.split('.').map(part => Number(part));
}
function compareConfigVersions(left, right) {
  const leftParts = configVersionParts(left);
  const rightParts = configVersionParts(right);
  if (!leftParts || !rightParts) return null;
  const count = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < count; index++) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference) return difference < 0 ? -1 : 1;
  }
  return 0;
}
function bpsSuicideAttemptMappingIssues(config) {
  if (!config || !Array.isArray(config.fieldMap)) return ['fieldMap is unavailable'];
  const issues = [];
  BPS_SUICIDE_ATTEMPT_MAPPING.forEach(expected => {
    const mapped = config.fieldMap.find(item => String(item?.dataQnFieldId || '') === expected.dataQnFieldId);
    if (!mapped) {
      issues.push(`missing ReliaTrax field ${expected.dataQnFieldId}`);
      return;
    }
    if (Number(mapped.fillIndex) !== expected.fillIndex) {
      issues.push(`field ${expected.dataQnFieldId} uses fill index ${mapped.fillIndex} instead of ${expected.fillIndex}`);
    }
    if (mapped.paths?.[0] !== expected.path) {
      issues.push(`field ${expected.dataQnFieldId} maps to ${mapped.paths?.[0] || 'no JSON path'} instead of ${expected.path}`);
    }
  });
  const prompt2 = (config.prompts || []).find(prompt => prompt?.id === 'prompt2')?.body || '';
  if (!prompt2.includes('"attempt_dates_and_methods":""')) issues.push('Prompt 2 does not request attempt_dates_and_methods');
  if (!prompt2.includes('"future_attempt_triggers":""')) issues.push('Prompt 2 does not request future_attempt_triggers');
  if (prompt2.includes('"attempt_methods":""')) issues.push('Prompt 2 still requests the removed attempt_methods field');
  return issues;
}
function selectBpsConfig(candidate, bundled, candidateLabel = 'Remote') {
  const bundledIssues = bpsSuicideAttemptMappingIssues(bundled);
  if (!candidate || typeof candidate !== 'object') {
    return {
      config: bundled,
      source: 'bundled',
      warning: `${candidateLabel} BPS config was unavailable. Using bundled BPS config v${bundled?.version || '?'}.`
    };
  }
  const candidateIssues = bpsSuicideAttemptMappingIssues(candidate);
  const versionOrder = compareConfigVersions(candidate.version, bundled?.version);
  const reasons = [];
  if (versionOrder !== null && versionOrder < 0) {
    reasons.push(`v${candidate.version || '?'} is older than bundled v${bundled?.version || '?'}`);
  }
  if (!bundledIssues.length && candidateIssues.length) {
    reasons.push(`the protected suicide-attempt mapping is incomplete (${candidateIssues.join('; ')})`);
  }
  if (reasons.length && bundled && !bundledIssues.length) {
    return {
      config: bundled,
      source: 'bundled',
      warning: `${candidateLabel} BPS config was not applied because ${reasons.join(' and ')}. Using bundled BPS config v${bundled.version || '?'}.`
    };
  }
  return { config: candidate, source: String(candidateLabel || 'remote').toLowerCase(), warning: '' };
}
function assertSafeBpsConfig(config) {
  const issues = bpsSuicideAttemptMappingIssues(config);
  if (!issues.length) return;
  throw new Error(`BPS fill blocked because config v${config?.version || '?'} could shift the suicide-attempt answers: ${issues.join('; ')}. Click Use bundled config, then scan or fill again.`);
}

let activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
let activeQuickNotesConfig = window.DEFAULT_ROSE_QUICKNOTES_CONFIG;
let workflowConfig = window.DEFAULT_ROSE_WORKFLOW_CONFIG || {};
let treatmentConfig = window.DEFAULT_ROSE_TREATMENT_CONFIG || { prompts: [] };
let defaultRows = [];
let traceLog = [];
let activeMode = 'bps';
let discoveryReport = null;
let visualMappingMode = 'off';
let diagnosticsPromptPreviewBase = '';
let treatmentSupportBundle = null;
let activeTreatmentScenario = '';
const $ = (id) => document.getElementById(id);

const MSE_REQUIRED_ITEMS = [
  'appearance',
  'build_stature',
  'posture',
  'eye_contact',
  'activity',
  'attitude_toward_examiner',
  'attitude_toward_parent_guardian',
  'separation_children_adolescent',
  'mood',
  'affect',
  'speech',
  'thought_process',
  'perception',
  'hallucinations',
  'thought_content',
  'delusions',
  'cognition',
  'intelligence_estimate',
  'insight',
  'judgment'
];

const MSE_SCREENSHOT_TERMS = [
  'Mental Health Status Exam',
  'Appearance',
  'Build Stature',
  'Mood, Affect, Speech, and Thought Process',
  'Perception, Hallucinations, Thought Content, and Delusions',
  'Cognition, Intelligence Estimate, Insight, and Judgement'
];

const ASAM_FUNCTIONING_ITEMS = [
  { key: 'housing', label: 'Housing', aliases: ['housing'] },
  { key: 'financial_stressors', label: 'Financial Stressors', aliases: ['financial', 'financial stressors', 'financial_stressors'] },
  { key: 'legal', label: 'Legal', aliases: ['legal'] },
  { key: 'employment', label: 'Employment', aliases: ['employment'] },
  { key: 'education_vocation', label: 'Education/Vocation', aliases: ['education', 'education/vocation', 'education_vocation', 'vocation'] },
  { key: 'independent_living', label: 'Independent Living', aliases: ['independent living', 'independent_living'] },
  { key: 'medical', label: 'Medical', aliases: ['medical'] },
  { key: 'social_natural_supports', label: 'Social/Natural Supports', aliases: ['social supports', 'social/nat. supports', 'social/natural supports', 'social_nat_supports', 'social_natural_supports'] }
];
const ASAM_FUNCTIONING_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const ASAM_DIMENSION_LABELS = ['None', 'Mild', 'Moderate', 'High', 'Severe'];
const DIAGNOSTICS_CONTEXT_PLACEHOLDER = '{{PART3_CONTEXT_FROM_ACTIVE_PAGE}}';
const DIAGNOSTICS_SCREENING_FIELDS = [
  { key: 'alcohol_screening_mast', label: 'Alcohol Screening MAST', aliases: ['mast', 'alcohol_screening_mast', 'alcohol screening mast'] },
  { key: 'drug_abuse_screening_dast_10', label: 'Drug Abuse Screening DAST 10', aliases: ['dast_10', 'dast10', 'drug_abuse_screening_dast_10', 'drug abuse screening dast 10'] },
  { key: 'depression_screening_phq_9', label: 'Depression Screening PHQ-9', aliases: ['phq_9', 'phq9', 'depression_screening_phq_9', 'depression screening phq 9'] },
  { key: 'anxiety_screening_gad_7', label: 'Anxiety Screening GAD 7', aliases: ['gad_7', 'gad7', 'anxiety_screening_gad_7', 'anxiety screening gad 7'] }
];
const DIAGNOSTICS_RECOMMENDATION_ITEMS = [
  { key: 'group', label: 'Group' },
  { key: 'individual', label: 'Individual' },
  { key: 'mental_health', label: 'Mental Health' },
  { key: 'medical', label: 'Medical' },
  { key: 'case_management', label: 'Case Management' },
  { key: 'peer_coaching', label: 'Peer Coaching' },
  { key: 'coordination_with_other_providers', label: 'Coordination with Other Providers' },
  { key: 'other_services', label: 'Other Services' }
];

function setStatus(msg) { $('status').textContent = msg; }
function logTo(id, value) { $(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function logErrorTo(id, err) {
  logTo(id, err?.diagnostic || {
    ok: false,
    source: 'Extension runtime',
    stage: 'unexpected_error',
    category: 'unexpected_error',
    blocking: true,
    message: err?.message || String(err)
  });
}
function ensureDiagnostic(err, { workflow = 'Extension workflow', stage = 'runtime', category = 'unexpected_error', nextAction = '' } = {}) {
  if (err?.diagnostic) return err;
  const wrapped = err instanceof Error ? err : new Error(String(err));
  wrapped.diagnostic = {
    ok: false,
    source: 'Extension runtime',
    stage,
    category,
    blocking: true,
    workflow,
    message: `We don't know exactly what went wrong, but ${wrapped.message || 'the extension stopped before this step could finish'}.`,
    details: wrapped.stack ? String(wrapped.stack).split('\n').slice(0, 3).join('\n') : '',
    nextAction: nextAction || 'Run Scan active page, copy the troubleshooting report, and include a screenshot of the active ReliaTrax page.'
  };
  return wrapped;
}
function redactUrlForReport(url) {
  try {
    const parsed = new URL(url || '');
    if (!['http:', 'https:'].includes(parsed.protocol)) return `${parsed.protocol}${parsed.pathname || ''}`;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return String(url || '');
  }
}
function isBlank(value) { return value === undefined || value === null || value === ''; }
function jsonLineColumnFromPosition(raw, position) {
  const before = String(raw || '').slice(0, Math.max(0, position));
  const lines = before.split(/\r\n|\r|\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}
function jsonParseLocation(err, raw) {
  const message = String(err?.message || '');
  const positionMatch = message.match(/\bposition\s+(\d+)\b/i);
  const lineColumnMatch = message.match(/\bline\s+(\d+)\s+column\s+(\d+)\b/i);
  const position = positionMatch
    ? Number(positionMatch[1])
    : (/unexpected end|end of json input/i.test(message) ? String(raw || '').length : undefined);
  const computed = Number.isInteger(position) ? jsonLineColumnFromPosition(raw, position) : {};
  return {
    position,
    line: lineColumnMatch ? Number(lineColumnMatch[1]) : computed.line,
    column: lineColumnMatch ? Number(lineColumnMatch[2]) : computed.column
  };
}
function visibleJsonSnippetText(value) {
  return String(value || '')
    .replace(/\t/g, '\\t')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ch => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
function jsonErrorSnippet(raw, location) {
  const line = Number(location?.line || 0);
  const column = Number(location?.column || 0);
  if (!line || !column) return '';
  const lines = String(raw || '').split(/\r\n|\r|\n/);
  const lineText = lines[line - 1] || '';
  const start = Math.max(0, column - 81);
  const end = Math.min(lineText.length, column + 80);
  const snippet = visibleJsonSnippetText(lineText.slice(start, end));
  const caretOffset = Math.max(0, column - 1 - start);
  return [
    `line ${line}, column ${column}`,
    snippet,
    `${' '.repeat(caretOffset)}^`
  ].join('\n');
}
function likelyJsonParseCause(err, raw = '', location = {}) {
  const message = String(err?.message || '');
  if (Number.isInteger(location?.position) && location.position >= String(raw || '').length) {
    return 'The response ends before its JSON object is complete. BastionGPT likely truncated the response or omitted a closing brace or required section.';
  }
  if (/bad control character|unterminated string/i.test(message)) {
    return 'A raw line break, tab, or other control character is inside a JSON string. BastionGPT likely returned malformed JSON or the copied response inserted an illegal character.';
  }
  if (/unexpected non-whitespace character|after json data/i.test(message)) {
    return 'Extra text appears before or after the JSON object. The response should contain one JSON object only.';
  }
  if (/unexpected token|expected property name|property names/i.test(message)) {
    return 'The response has JSON syntax that JavaScript cannot parse, such as missing quotes, a trailing comma, or pasted prose.';
  }
  return 'The response is not valid JSON.';
}
function jsonParseDiagnostic(raw, label, err) {
  const location = jsonParseLocation(err, raw);
  return {
    ok: false,
    source: 'BastionGPT response',
    stage: 'parse',
    category: 'invalid_json',
    blocking: true,
    workflow: label,
    message: `${label} is not valid JSON. Nothing was filled.`,
    parserMessage: err?.message || String(err),
    likelyCause: likelyJsonParseCause(err, raw, location),
    position: location.position,
    line: location.line,
    column: location.column,
    snippet: jsonErrorSnippet(raw, location),
    nextAction: 'Regenerate the complete BastionGPT response as one valid JSON object. Do not guess at missing braces or delete sections; then validate again before filling.'
  };
}
function parseJsonWithDiagnostic(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    const wrapped = new Error(`${label} is not valid JSON.`);
    wrapped.diagnostic = jsonParseDiagnostic(raw, label, err);
    throw wrapped;
  }
}
const BPS_PROMPT_EXPECTED_TOP_LEVEL_KEYS = {
  1: ['living_situation', 'substance_use', 'tobacco', 'withdrawal', 'previous_substance_use_treatment'],
  2: ['mental_health', 'mental_health_treatment', 'symptoms_suicide_self_harm', 'trauma_grief', 'violence'],
  3: ['legal', 'family', 'spiritual_cultural', 'medical', 'medications'],
  4: ['sexual_history', 'vocational', 'educational', 'military', 'current_marital_status_and_living_environment', 'hobbies_activities', 'additional_addiction_questions', 'strengths_challenges']
};
function parseJsonStringToken(literal) {
  try { return JSON.parse(literal); }
  catch {
    if (!literal.startsWith('"') || !literal.endsWith('"')) {
      throw new Error('The original response contains an unterminated JSON string and cannot be safely auto-corrected.');
    }
    const escapedControls = literal.replace(/[\u0000-\u001f]/g, character =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
    );
    try { return JSON.parse(escapedControls); }
    catch { throw new Error('The original response contains an invalid JSON string and cannot be safely auto-corrected.'); }
  }
}
function jsonPrimitiveTokenSequence(source) {
  const text = String(source || '');
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char) || '{}[],:'.includes(char)) {
      index += 1;
      continue;
    }
    if (char === '"') {
      const start = index;
      index += 1;
      let escaped = false;
      while (index < text.length) {
        const current = text[index++];
        if (escaped) escaped = false;
        else if (current === '\\') escaped = true;
        else if (current === '"') break;
      }
      const literal = text.slice(start, index);
      tokens.push(['string', parseJsonStringToken(literal)]);
      continue;
    }
    const start = index;
    while (index < text.length && !/[\s{}\[\],:]/.test(text[index])) index += 1;
    tokens.push(['literal', text.slice(start, index)]);
  }
  return tokens;
}
function validateJsonRepairForTarget(originalRaw, correctedRaw, target) {
  const corrected = parseJsonWithDiagnostic(String(correctedRaw || '').trim(), `${target.label} corrected response`);
  if (!corrected || typeof corrected !== 'object' || Array.isArray(corrected)) {
    throw new Error(`${target.label} corrected response must be one JSON object.`);
  }
  const actualKeys = Object.keys(corrected);
  if (target.expectedTopLevelKeys.length && JSON.stringify(actualKeys) !== JSON.stringify(target.expectedTopLevelKeys)) {
    throw new Error(`The correction was rejected because its top-level keys did not exactly match the known-good ${target.label} example.`);
  }
  const originalTokens = jsonPrimitiveTokenSequence(originalRaw);
  const correctedTokens = jsonPrimitiveTokenSequence(correctedRaw);
  if (JSON.stringify(originalTokens) !== JSON.stringify(correctedTokens)) {
    throw new Error('The correction was rejected because it changed, added, removed, or reordered a key or value. The original response remains untouched.');
  }
  if (target.strictShape && !sameJsonShape(corrected, JSON.parse(target.knownGoodExample))) {
    throw new Error(`The correction was rejected because it did not match the known-good ${target.label} structure.`);
  }
  if (target.promptNumber) {
    const structureDiagnostic = bpsPromptStructureDiagnostic(target.promptNumber, corrected);
    if (structureDiagnostic) throw new Error(structureDiagnostic.message);
  }
  return corrected;
}
function firstCompleteJsonObject(text) {
  const source = String(text || '');
  const start = source.indexOf('{');
  if (start < 0) return '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  return '';
}
function bpsPromptExpectedOutputShape(promptNumber) {
  const expectedKeys = BPS_PROMPT_EXPECTED_TOP_LEVEL_KEYS[promptNumber] || [];
  const prompt = (activeConfig?.prompts || []).find((item, index) =>
    item?.id === `prompt${promptNumber}` ||
    Number(item?.promptNumber || item?.number || 0) === promptNumber ||
    index === promptNumber - 1
  );
  const body = String(prompt?.body || '');
  const marker = 'Return ONLY this JSON structure:';
  const markerIndex = body.lastIndexOf(marker);
  if (markerIndex >= 0) {
    const candidate = firstCompleteJsonObject(body.slice(markerIndex + marker.length));
    try {
      const parsed = JSON.parse(candidate);
      if (JSON.stringify(Object.keys(parsed)) === JSON.stringify(expectedKeys)) return JSON.stringify(parsed);
    } catch {}
  }
  return `{${expectedKeys.map(key => `"${key}":{}`).join(',')}}`;
}
function jsonExampleAfterMarkers(source, markers) {
  const body = String(source || '');
  for (const marker of markers) {
    const markerIndex = body.toLowerCase().indexOf(String(marker).toLowerCase());
    if (markerIndex < 0) continue;
    const candidate = firstCompleteJsonObject(body.slice(markerIndex + marker.length));
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return JSON.stringify(parsed);
    } catch {}
  }
  return '';
}
function sameJsonShape(actual, expected) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (!expected.length) return true;
    return actual.every(item => sameJsonShape(item, expected[0]));
  }
  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    const expectedKeys = Object.keys(expected);
    if (JSON.stringify(Object.keys(actual)) !== JSON.stringify(expectedKeys)) return false;
    return expectedKeys.every(key => sameJsonShape(actual[key], expected[key]));
  }
  if (expected === null) return actual === null;
  return typeof actual === typeof expected;
}
function workflowModeKnownGoodExample(mode) {
  const bundledMode = window.DEFAULT_ROSE_WORKFLOW_CONFIG?.modes?.[mode];
  const activeModeConfig = workflowMode(mode);
  const body = bundledMode?.sourcePrompt?.body || activeModeConfig?.sourcePrompt?.body || '';
  return jsonExampleAfterMarkers(body, [
    'Use this exact top-level shape:',
    'Use this exact top level JSON shape:'
  ]);
}
function treatmentKnownGoodExample() {
  const scenarioId = selectedTreatmentPrompt()?.id || '';
  const instructions = window.DEFAULT_ROSE_TREATMENT_CONFIG?.outputFormat?.instructions || treatmentConfig?.outputFormat?.instructions || '';
  return jsonExampleAfterMarkers(
    String(instructions).replace(/\{\{SCENARIO_ID\}\}/g, scenarioId),
    ['Use exactly this top-level shape and do not add keys:']
  );
}
function quickNotesKnownGoodExample() {
  return JSON.stringify({
    quicknotes: {
      controls: {
        3: 'Example concise clinical response.',
        7: true
      }
    }
  });
}
function jsonRepairTarget(responseType) {
  const bpsMatch = String(responseType || '').match(/^bps_prompt_([1-4])$/);
  if (bpsMatch) {
    const promptNumber = Number(bpsMatch[1]);
    const knownGoodExample = bpsPromptExpectedOutputShape(promptNumber);
    return {
      responseType,
      mode: 'bps',
      label: `BPS Prompt ${promptNumber}`,
      promptNumber,
      textareaId: `resp${promptNumber}`,
      buttonId: `resp${promptNumber}Repair`,
      statusId: `resp${promptNumber}RepairStatus`,
      resultId: `resp${promptNumber}RepairResult`,
      expectedTopLevelKeys: BPS_PROMPT_EXPECTED_TOP_LEVEL_KEYS[promptNumber],
      knownGoodExample,
      strictShape: true,
      validateCurrent: () => parseBpsResponse(promptNumber),
      save: () => saveResponses()
    };
  }
  const definitions = {
    mse: {
      label: 'MSE Part 2',
      textareaId: 'mseResp',
      knownGoodExample: workflowModeKnownGoodExample('mse'),
      validateCurrent: validateMseResponse,
      save: saveMseResponse
    },
    asam: {
      label: 'Case Management and ASAM Part 3',
      textareaId: 'asamResp',
      knownGoodExample: workflowModeKnownGoodExample('asam'),
      validateCurrent: validateAsamResponse,
      save: saveAsamResponse
    },
    diagnostics: {
      label: 'Diagnostics Part 4',
      textareaId: 'diagnosticsResp',
      knownGoodExample: workflowModeKnownGoodExample('diagnostics'),
      validateCurrent: validateDiagnosticsResponse,
      save: saveDiagnosticsResponse
    },
    treatment: {
      label: 'Treatment Plan',
      textareaId: 'treatmentResp',
      knownGoodExample: treatmentKnownGoodExample(),
      validateCurrent: validateTreatmentResponse,
      save: saveTreatmentResponse
    },
    quicknotes: {
      label: 'QuickNotes / Group Notes',
      textareaId: 'quicknotesResp',
      knownGoodExample: quickNotesKnownGoodExample(),
      validateCurrent: validateQuickNotesResponse,
      save: saveQuickNotesResponse,
      strictShape: false,
      flexibleTopLevelKeys: true
    }
  };
  const definition = definitions[responseType];
  if (!definition?.knownGoodExample) throw new Error('No known-good JSON example is available for this response.');
  const textareaId = definition.textareaId;
  return {
    responseType,
    mode: responseType,
    ...definition,
    buttonId: `${textareaId}Repair`,
    statusId: `${textareaId}RepairStatus`,
    resultId: `${textareaId}RepairResult`,
    expectedTopLevelKeys: definition.flexibleTopLevelKeys ? [] : Object.keys(JSON.parse(definition.knownGoodExample)),
    strictShape: definition.strictShape !== false
  };
}
const BPS_PROMPT_1_REQUIRED_SHAPE = [
  { path: 'living_situation', type: 'object' },
  { path: 'substance_use', type: 'object' },
  { path: 'substance_use.no_history' },
  { path: 'substance_use.substance_1', type: 'object' },
  { path: 'substance_use.substance_2', type: 'object' },
  { path: 'substance_use.substance_3', type: 'object' },
  { path: 'substance_use.other_substances' },
  { path: 'tobacco', type: 'object' },
  { path: 'withdrawal', type: 'object' },
  { path: 'previous_substance_use_treatment', type: 'object' }
];
const BPS_PROMPT_1_TOP_LEVEL_SECTIONS = [
  'living_situation',
  'substance_use',
  'tobacco',
  'withdrawal',
  'previous_substance_use_treatment'
];
function objectHasOwnPath(value, path) {
  let current = value;
  for (const part of String(path || '').split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current) || !Object.hasOwn(current, part)) return false;
    current = current[part];
  }
  return true;
}
function objectValueAtPath(value, path) {
  return String(path || '').split('.').reduce((current, part) => current?.[part], value);
}
function findNestedKeyPaths(value, key, path = '', matches = []) {
  if (!value || typeof value !== 'object') return matches;
  for (const [childKey, childValue] of Object.entries(value)) {
    const childPath = path ? `${path}.${childKey}` : childKey;
    if (childKey === key) matches.push(childPath);
    if (childValue && typeof childValue === 'object') findNestedKeyPaths(childValue, key, childPath, matches);
  }
  return matches;
}
function bpsPrompt1StructureIssues(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['Prompt 1 must be one JSON object.'];
  }
  const issues = [];
  const misplacedTopLevelSections = new Set();
  for (const section of BPS_PROMPT_1_TOP_LEVEL_SECTIONS) {
    if (Object.hasOwn(value, section)) continue;
    const nestedPaths = findNestedKeyPaths(value, section).filter(path => path !== section);
    if (nestedPaths.length) {
      issues.push(`${section} must be top-level; found at ${nestedPaths[0]}.`);
      misplacedTopLevelSections.add(section);
    }
  }
  for (const requirement of BPS_PROMPT_1_REQUIRED_SHAPE) {
    if (!objectHasOwnPath(value, requirement.path)) {
      if (!misplacedTopLevelSections.has(requirement.path)) issues.push(`Missing ${requirement.path}.`);
      continue;
    }
    const actual = objectValueAtPath(value, requirement.path);
    if (requirement.type === 'object' && (!actual || typeof actual !== 'object' || Array.isArray(actual))) {
      issues.push(`${requirement.path} must be an object.`);
    }
  }
  return issues;
}
function bpsPromptStructureDiagnostic(promptNumber, value) {
  if (promptNumber !== 1) return null;
  const issues = bpsPrompt1StructureIssues(value);
  if (!issues.length) return null;
  return {
    ok: false,
    source: 'BastionGPT response',
    stage: 'structure',
    category: 'incomplete_json_structure',
    blocking: true,
    workflow: 'Prompt 1',
    message: 'Prompt 1 JSON is incomplete or incorrectly structured. Nothing was filled.',
    issues,
    nextAction: 'Regenerate Prompt 1 in BastionGPT using the complete requested JSON shape. Do not repair it by only appending a closing brace; then validate again before filling.'
  };
}
function bpsResponseWarningText(diagnostic) {
  if (!diagnostic) return '';
  return [
    `${diagnostic.workflow || 'BastionGPT response'} needs correction.`,
    'This response could not be read, so nothing was filled.',
    'Use Correct with ChatGPT below, or paste a new response and try again.'
  ].join('\n');
}
function renderBpsResponseWarning(promptNumber, diagnostic = null) {
  const textarea = $(`resp${promptNumber}`);
  const warning = $(`resp${promptNumber}Warning`);
  if (!textarea || !warning) return;
  const warningText = $(`resp${promptNumber}WarningText`) || warning;
  const visible = Boolean(diagnostic);
  textarea.classList.toggle('json-invalid', visible);
  textarea.setAttribute('aria-invalid', String(visible));
  warningText.textContent = visible ? bpsResponseWarningText(diagnostic) : '';
  warning.classList.toggle('hidden', !visible);
}
function n8nJsonRepairUrl() {
  return N8N_LOGGING_CONFIG.enabled ? String(N8N_LOGGING_CONFIG.repairUrl || '').trim() : '';
}
async function requestN8nJsonRepair({ responseType, mode, responseLabel, rawJson, expectedTopLevelKeys, knownGoodExample, strictShape }) {
  const url = n8nJsonRepairUrl();
  if (!url) throw new Error('The correction service is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_LOGGING_CONFIG.repairRequestTimeoutMs || 45000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'rose_json_repair_request',
        requestVersion: 2,
        responseType,
        mode,
        responseLabel,
        rawJson,
        expectedTopLevelKeys,
        knownGoodExample,
        strictShape
      }),
      signal: controller.signal
    });
    const responseText = await response.text();
    let body = null;
    try { body = responseText ? JSON.parse(responseText) : null; } catch {}
    if (!response.ok) throw new Error(`The correction service returned ${response.status}.`);
    if (!body || body.ok === false || typeof body.correctedJson !== 'string' || !body.correctedJson.trim()) {
      throw new Error('The correction service returned an incomplete result.');
    }
    return body;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('The correction service timed out.');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
async function repairJsonResponseWithN8n(responseType) {
  const target = jsonRepairTarget(responseType);
  const textarea = $(target.textareaId);
  const button = $(target.buttonId);
  const repairStatus = $(target.statusId);
  const repairResult = $(target.resultId);
  if (button?.disabled) return;
  const rawJson = String(textarea?.value || '').trim();
  if (!rawJson) {
    if (repairStatus) repairStatus.textContent = 'Paste the response first.';
    return;
  }
  repairResult?.classList.toggle('hidden', true);
  if (repairResult) repairResult.textContent = '';
  try {
    target.validateCurrent();
    if (repairStatus) repairStatus.textContent = 'This response is already valid and does not need correction.';
    return;
  } catch {
    // Validation failures are the entry point for syntax/structure repair.
  }
  if (!rawJson.startsWith('{')) {
    if (repairStatus) repairStatus.textContent = 'Only a malformed JSON object can be corrected. Your original response is still here.';
    return;
  }
  if (button) {
    button.disabled = true;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Correcting…';
  }
  if (repairStatus) repairStatus.textContent = 'Correcting with ChatGPT and checking the result…';
  setStatus(`Correcting ${target.label} JSON`);
  try {
    const response = await requestN8nJsonRepair({
      responseType: target.responseType,
      mode: target.mode,
      responseLabel: target.label,
      rawJson,
      expectedTopLevelKeys: target.expectedTopLevelKeys,
      knownGoodExample: target.knownGoodExample,
      strictShape: target.strictShape
    });
    const corrected = validateJsonRepairForTarget(rawJson, response.correctedJson, target);
    const originalValue = textarea.value;
    textarea.value = JSON.stringify(corrected);
    try {
      target.validateCurrent();
      await target.save();
    } catch (err) {
      textarea.value = originalValue;
      throw err;
    }
    if (repairStatus) repairStatus.textContent = '';
    if (repairResult) {
      repairResult.textContent = 'Corrected and checked. The response is ready to use.';
      repairResult.classList.toggle('hidden', false);
    }
    setStatus(`${target.label} JSON corrected and validated`);
  } catch (err) {
    console.error(`${target.label} JSON correction failed:`, err);
    if (repairStatus) repairStatus.textContent = 'We could not correct this response right now. Your original response is still here.';
    setStatus(`${target.label} correction failed`);
  } finally {
    if (button) {
      button.disabled = false;
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      button.textContent = 'Correct with ChatGPT';
    }
  }
}
async function repairBpsResponseWithN8n(promptNumber) {
  return repairJsonResponseWithN8n(`bps_prompt_${promptNumber}`);
}
function parseBpsResponse(promptNumber) {
  const raw = String($(`resp${promptNumber}`)?.value || '').trim();
  if (!raw) {
    renderBpsResponseWarning(promptNumber);
    return {};
  }
  let parsed;
  try {
    parsed = parseJsonWithDiagnostic(raw, `Prompt ${promptNumber}`);
  } catch (err) {
    renderBpsResponseWarning(promptNumber, err.diagnostic);
    throw err;
  }
  const structureDiagnostic = bpsPromptStructureDiagnostic(promptNumber, parsed);
  renderBpsResponseWarning(promptNumber, structureDiagnostic);
  if (structureDiagnostic) {
    const err = new Error(structureDiagnostic.message);
    err.diagnostic = structureDiagnostic;
    throw err;
  }
  return parsed;
}
function refreshBpsResponseWarning(promptNumber) {
  try { parseBpsResponse(promptNumber); } catch {}
}
function blockingDiagnostic({ source, stage, category, workflow, message, details, nextAction }) {
  const err = new Error(message);
  err.diagnostic = {
    ok: false,
    source,
    stage,
    category,
    blocking: true,
    workflow,
    message,
    details,
    nextAction
  };
  return err;
}
function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) target[k] = deepMerge(target[k] || {}, v);
    else target[k] = v;
  }
  return target;
}
function parseJsonBox(id) {
  const promptMatch = String(id || '').match(/^resp([1-4])$/);
  if (promptMatch) return parseBpsResponse(Number(promptMatch[1]));
  const raw = $(id).value.trim();
  if (!raw) return {};
  return JSON.parse(raw);
}
function validateAndMerge() {
  const merged = {};
  const errors = [];
  for (let i = 1; i <= 4; i++) {
    try { deepMerge(merged, parseJsonBox(`resp${i}`)); }
    catch (err) { errors.push(`Prompt ${i}: ${err.message}`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return merged;
}
function parseDefaultAnswer(raw) {
  const text = String(raw ?? '').trim();
  if (text.toLowerCase() === 'true') return true;
  if (text.toLowerCase() === 'false') return false;
  if (text.toLowerCase() === 'null') return '';
  return raw ?? '';
}
function setPath(obj, path, value) {
  if (!path || typeof path !== 'string') return;
  const parts = path.split('.').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return;
  let cur = obj;
  parts.slice(0, -1).forEach(part => { cur[part] = cur[part] || {}; cur = cur[part]; });
  cur[parts[parts.length - 1]] = value;
}
function flattenDefaultObject(obj, prefix = '', rows = []) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return rows;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flattenDefaultObject(value, path, rows);
    else rows.push({ question: path, answer: value });
  }
  return rows;
}
function getConfigDefaultRows(config) {
  if (Array.isArray(config.defaultAnswers)) {
    return config.defaultAnswers.map(row => ({ question: row.question || '', answer: row.answer ?? '' }));
  }
  return flattenDefaultObject(config.autoDefaultAnswers || {});
}
function getWorkflowDefaultRows(mode) {
  const defaults = workflowMode(mode).defaultAnswers;
  return Array.isArray(defaults)
    ? defaults.map(row => ({ question: row.question || '', answer: row.answer ?? '' }))
    : [];
}
function defaultRowsToObject(rows) {
  const obj = {};
  for (const row of rows || []) {
    const question = String(row.question || '').trim();
    if (!question) continue;
    setPath(obj, question, parseDefaultAnswer(row.answer));
  }
  return obj;
}
function normalizedDefaultRows() {
  return (defaultRows || [])
    .map(row => ({ question: String(row.question || '').trim(), answer: row.answer ?? '' }))
    .filter(row => row.question);
}
function defaultRowsForStorage() {
  return (defaultRows || []).map(row => ({ question: row.question ?? '', answer: row.answer ?? '' }));
}
async function saveResponses() {
  const responses = [1,2,3,4].map(i => $(`resp${i}`).value);
  await chrome.storage.local.set({ [STORAGE_KEYS.responses]: responses });
}
async function saveMerged(merged) {
  await chrome.storage.local.set({ [STORAGE_KEYS.merged]: merged });
}
async function saveDefaultRows(shouldRender = true) {
  defaultRows = defaultRowsForStorage();
  await chrome.storage.local.set({ [STORAGE_KEYS.defaultRows]: defaultRows });
  const activeCount = normalizedDefaultRows().length;
  $('defaultCount').textContent = `${activeCount} active default${activeCount === 1 ? '' : 's'}`;
  if (shouldRender) renderDefaultRows();
}
async function saveTraceLog() {
  traceLog = (traceLog || []).slice(-8);
  await chrome.storage.local.set({ [STORAGE_KEYS.traceLog]: traceLog });
  renderTraceLog();
}
function getBastionGptResponsesForTrace() {
  return [1, 2, 3, 4].map((i) => ({
    prompt: i,
    response: String($(`resp${i}`)?.value || '')
  }));
}
function renderPrompts() {
  const box = $('promptButtons');
  box.innerHTML = '';
  (activeConfig.prompts || []).forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `Copy P${idx + 1}`;
    btn.title = p.title || p.id;
    btn.onclick = async () => { await navigator.clipboard.writeText(promptBodyForCopy(p.body)); setStatus(`Copied ${p.title || p.id}`); };
    box.appendChild(btn);
  });
  $('configMeta').textContent = `${activeConfig.project || 'Config'} v${activeConfig.version || '?'} | ${activeConfig.fieldMap?.length || 0} mapped fields | expects ${activeConfig.expectedFieldCount || '?'} fields`;
}
function promptBodyForCopy(body) {
  return String(body || '');
}
function renderQuestionPathOptions() {
  const options = $('questionPathOptions');
  options.innerHTML = '';
  const paths = new Set();
  (activeConfig.fieldMap || []).forEach(item => (item.paths || []).forEach(path => paths.add(path)));
  [...paths].sort().forEach(path => {
    const option = document.createElement('option');
    option.value = path;
    options.appendChild(option);
  });
}
function renderDefaultRows() {
  const body = $('defaultsBody');
  body.innerHTML = '';
  defaultRows = defaultRowsForStorage();
  const activeCount = normalizedDefaultRows().length;
  $('defaultCount').textContent = `${activeCount} active default${activeCount === 1 ? '' : 's'}`;
  defaultRows.forEach((row, index) => {
    const tr = document.createElement('tr');

    const qTd = document.createElement('td');
    const qInput = document.createElement('input');
    qInput.className = 'question-input';
    qInput.setAttribute('list', 'questionPathOptions');
    qInput.value = row.question || '';
    qInput.placeholder = 'section.question_path';
    qInput.addEventListener('input', () => { defaultRows[index].question = qInput.value; debounceSaveDefaults(); });
    qTd.appendChild(qInput);

    const aTd = document.createElement('td');
    const aInput = document.createElement('textarea');
    aInput.value = row.answer ?? '';
    aInput.placeholder = 'Answer, true, or false';
    aInput.addEventListener('input', () => { defaultRows[index].answer = aInput.value; debounceSaveDefaults(); });
    aTd.appendChild(aInput);

    const rTd = document.createElement('td');
    const remove = document.createElement('button');
    remove.className = 'icon-btn danger';
    remove.textContent = 'Remove';
    remove.onclick = async () => { defaultRows.splice(index, 1); await saveDefaultRows(); setStatus('Removed default answer'); };
    rTd.appendChild(remove);

    tr.appendChild(qTd);
    tr.appendChild(aTd);
    tr.appendChild(rTd);
    body.appendChild(tr);
  });
}
function renderReadOnlyDefaultRows(bodyId, countId, rows) {
  const body = $(bodyId);
  const count = $(countId);
  if (!body || !count) return;
  body.innerHTML = '';
  const visibleRows = (rows || []).filter(row => String(row.question || '').trim());
  count.textContent = `${visibleRows.length} default${visibleRows.length === 1 ? '' : 's'}`;
  visibleRows.forEach(row => {
    const tr = document.createElement('tr');
    const qTd = document.createElement('td');
    const qCode = document.createElement('code');
    qCode.textContent = row.question || '';
    qTd.appendChild(qCode);
    const aTd = document.createElement('td');
    aTd.textContent = String(row.answer ?? '');
    tr.appendChild(qTd);
    tr.appendChild(aTd);
    body.appendChild(tr);
  });
}
let defaultSaveTimer = null;
function debounceSaveDefaults() {
  clearTimeout(defaultSaveTimer);
  defaultSaveTimer = setTimeout(() => saveDefaultRows(false).catch(err => setStatus(err.message)), 450);
}
function renderTraceLog() {
  logTo('traceLog', traceLog?.length ? traceLog : 'No trace entries yet. Run Scan or Fill to create logs.');
}
function workflowMode(mode) {
  return workflowConfig?.modes?.[mode] || {};
}
function workflowModeSummary(mode) {
  const cfg = workflowMode(mode);
  return {
    mode,
    title: cfg.title || '',
    mappingStatus: cfg.mappingStatus || '',
    fieldMapCount: Array.isArray(cfg.fieldMap) ? cfg.fieldMap.length : 0,
    expectedFieldCount: cfg.expectedFieldCount ?? null,
    selector: cfg.selector || '',
    onlyVisibleControls: cfg.onlyVisibleControls ?? null
  };
}
function configSummary() {
  const bpsMappingIssues = bpsSuicideAttemptMappingIssues(activeConfig);
  return {
    bpsConfigVersion: activeConfig?.version || '',
    bpsFieldMapCount: Array.isArray(activeConfig?.fieldMap) ? activeConfig.fieldMap.length : 0,
    bpsSuicideAttemptMappingSafe: !bpsMappingIssues.length,
    bpsSuicideAttemptMappingIssues: bpsMappingIssues,
    workflowVersion: workflowConfig?.version || '',
    diagnostics: workflowModeSummary('diagnostics'),
    mse: workflowModeSummary('mse'),
    asam: workflowModeSummary('asam'),
    treatment: workflowModeSummary('treatment'),
    treatmentPromptVersion: treatmentConfig?.version || '',
    treatmentPromptCount: Array.isArray(treatmentConfig?.prompts) ? treatmentConfig.prompts.length : 0,
    quicknotesFieldMapCount: Array.isArray(activeQuickNotesConfig?.fieldMap) ? activeQuickNotesConfig.fieldMap.length : 0
  };
}
function renderConfigMeta(message = '') {
  const summary = configSummary();
  const diagnostics = summary.diagnostics;
  const parts = [
    message,
    summary.bpsConfigVersion ? `BPS ${summary.bpsConfigVersion}` : 'BPS version unavailable',
    summary.bpsSuicideAttemptMappingSafe ? 'Suicide-attempt map verified' : 'Suicide-attempt map unsafe',
    summary.workflowVersion ? `Workflow ${summary.workflowVersion}` : 'Workflow version unavailable',
    `Diagnostics map ${diagnostics.fieldMapCount}${diagnostics.expectedFieldCount ? ` / ${diagnostics.expectedFieldCount} fields expected` : ''}`
  ].filter(Boolean);
  if ($('configMeta')) $('configMeta').textContent = parts.join(' | ');
}
function logConfigResult(value, message = '') {
  renderConfigMeta(message);
  if ($('configResults')) logTo('configResults', value);
}
function migrateLegacyConfigUrl(url) {
  if (typeof url !== 'string') return url;
  const migrated = url;
  if (!CONFIG_FILE_RE.test(migrated) || migrated.includes(`/${CONFIG_REPO_DATA_DIR}/`)) return migrated;
  return migrated.replace(CONFIG_FILE_RE, `${CONFIG_REPO_DATA_DIR}/$1`);
}
function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}
function resolveConfigUrl(url, baseUrl = '') {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) return '';
  if (isHttpUrl(value)) return migrateLegacyConfigUrl(value);
  if (!isHttpUrl(baseUrl)) return '';
  return migrateLegacyConfigUrl(new URL(value, baseUrl).href);
}
function workflowConfigUrlFromConfigUrl(url) {
  const normalizedUrl = migrateLegacyConfigUrl(url || '');
  if (!normalizedUrl || !CONFIG_FILE_RE.test(normalizedUrl)) return DEFAULT_WORKFLOW_CONFIG_URL;
  return normalizedUrl.replace(CONFIG_FILE_RE, 'rose-reliatrax-workflows-config.json');
}
function normalizeWorkflowConfigUrls(config, baseUrl = DEFAULT_WORKFLOW_CONFIG_URL) {
  if (!config?.modes || typeof config.modes !== 'object') return config;
  const normalized = { ...config, modes: { ...config.modes } };
  Object.entries(config.modes).forEach(([key, mode]) => {
    if (!mode || typeof mode !== 'object') return;
    const normalizedMode = { ...mode };
    if (normalizedMode.configUrl) {
      normalizedMode.configUrl = resolveConfigUrl(normalizedMode.configUrl, baseUrl) || migrateLegacyConfigUrl(normalizedMode.configUrl);
    }
    normalized.modes[key] = normalizedMode;
  });
  return normalized;
}
function modeDescription(mode) {
  return workflowMode(mode).description || workflowMode('bps').description || 'Mode details unavailable.';
}
function modeTitle(mode) {
  return workflowMode(mode).title || 'Mode setup';
}
function modeSourcePrompt(mode) {
  return workflowMode(mode).sourcePrompt || null;
}
function treatmentPrompts() {
  return Array.isArray(treatmentConfig?.prompts) ? treatmentConfig.prompts : [];
}
function selectedTreatmentPrompt() {
  const prompts = treatmentPrompts();
  const selectedId = $('treatmentScenario')?.value || activeTreatmentScenario || '';
  return prompts.find(prompt => prompt.id === selectedId) || prompts[0] || null;
}
function treatmentPromptOutputInstructions(prompt) {
  return [
    treatmentConfig?.outputFormat?.instructions,
    treatmentConfig?.outputFormat?.completionDateInstructions
  ]
    .filter(Boolean)
    .join('\n\n')
    .replace(/\{\{SCENARIO_ID\}\}/g, String(prompt?.id || ''))
    .trim();
}
function treatmentPromptCurrentDate() {
  const now = new Date();
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][now.getMonth()];
  return `CURRENT DATE FOR COMPLETION DATE CALCULATIONS\n\n${month} ${now.getDate()}, ${now.getFullYear()}`;
}
function effectiveTreatmentPrompt(prompt) {
  const clinicalPrompt = String(prompt?.body || '').trim();
  const outputInstructions = treatmentPromptOutputInstructions(prompt);
  return [clinicalPrompt, outputInstructions, treatmentPromptCurrentDate()].filter(Boolean).join('\n\n---\n\n');
}
function renderTreatmentPrompt() {
  const select = $('treatmentScenario');
  const preview = $('treatmentPromptPreview');
  if (!select || !preview) return;
  const prompts = treatmentPrompts();
  const current = select.value;
  select.innerHTML = '';
  prompts.forEach(prompt => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = `${prompt.number}. ${prompt.title}`;
    select.appendChild(option);
  });
  const desired = prompts.some(prompt => prompt.id === current)
    ? current
    : (prompts.some(prompt => prompt.id === activeTreatmentScenario) ? activeTreatmentScenario : prompts[0]?.id);
  if (desired) select.value = desired;
  activeTreatmentScenario = select.value || '';
  const selected = selectedTreatmentPrompt();
  if (!selected) {
    $('treatmentPromptMeta').textContent = 'No Treatment Plan prompts are loaded.';
    preview.textContent = '';
    return;
  }
  $('treatmentPromptMeta').textContent = `${treatmentConfig?.source?.subject || 'Treatment Plan Prompts (4)'} | received ${treatmentConfig?.source?.receivedAt || ''}`;
  preview.textContent = effectiveTreatmentPrompt(selected);
}
function renderMsePrompt() {
  const source = workflowMode('mse').sourcePrompt;
  if (!$('msePromptPreview')) return;
  if (!source) {
    $('msePromptMeta').textContent = 'No MSE source prompt is loaded.';
    $('msePromptPreview').textContent = '';
    return;
  }
  $('msePromptMeta').textContent = `${source.title} | ${source.source}`;
  $('msePromptPreview').textContent = source.body || '';
}
function renderAsamPrompt() {
  const source = workflowMode('asam').sourcePrompt;
  if (!$('asamPromptPreview')) return;
  if (!source) {
    $('asamPromptMeta').textContent = 'No Part 3 source prompt is loaded.';
    $('asamPromptPreview').textContent = '';
    return;
  }
  $('asamPromptMeta').textContent = `${source.title} | ${source.source}`;
  $('asamPromptPreview').textContent = source.body || '';
}
function selectedFunctioningText(item) {
  const score = Number.isInteger(item?.score) ? item.score : '';
  const severity = item?.severity || '';
  if (score !== '' && severity) return `${score} ${severity}`;
  return severity || String(score);
}
function formatDiagnosticsPart3Context(context, supplementalText = '') {
  const lines = [
    'PART 3 CASE MANAGEMENT AND ASAM CONTEXT FROM ACTIVE RELIATRAX PAGE',
    '',
    'Use the following Case Management Assessment and ASAM Part 3 information as clinical context for Diagnostics Part 4. The ASAM dimension textbox values below were pulled verbatim from the active ReliaTrax page.'
  ];
  const functioning = context?.functioning || [];
  if (functioning.length) {
    lines.push('', 'Case Management Functioning Scores');
    functioning.forEach(item => {
      lines.push(`${item.label}: ${selectedFunctioningText(item) || ''}`);
    });
  }
  const dimensions = context?.dimensions || [];
  if (dimensions.length) {
    lines.push('', 'ASAM Criteria Textboxes');
    dimensions.forEach(item => {
      lines.push('', `Dimension ${item.dimension} - ${item.title}`, item.text || '');
    });
  }
  const safety = context?.safety_planning || {};
  lines.push(
    '',
    'Safety Planning',
    'Is additional safety planning needed?',
    safety.additional_safety_planning_needed || '',
    '',
    'Why or why not?',
    safety.why_or_why_not || ''
  );
  if (supplementalText) {
    lines.push('', supplementalText);
  }
  if ((context?.warnings || []).length) {
    lines.push('', 'Context extraction warnings');
    context.warnings.forEach(warning => lines.push(`- ${warning}`));
  }
  return lines.join('\n');
}
function textFromDiagnosticsValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(textFromDiagnosticsValue).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const ordered = [
      value.narrative,
      value.text,
      value.summary,
      value.rationale,
      value.diagnostic_rationale,
      value.asam_rationale,
      value.why_lower_level_is_not_indicated,
      value.why_higher_level_is_not_indicated
    ].map(textFromDiagnosticsValue).filter(Boolean);
    if (ordered.length) return ordered.join('\n\n');
    return Object.values(value).map(textFromDiagnosticsValue).filter(Boolean).join('\n\n');
  }
  return String(value || '').trim();
}
function joinAssessmentParagraphs(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return textFromDiagnosticsValue(value);
  return Object.entries(value)
    .filter(([key]) => /^paragraph/i.test(key) || /summary|narrative/i.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, paragraph]) => textFromDiagnosticsValue(paragraph))
    .filter(Boolean)
    .join('\n\n');
}
function formatSavedPart3SupplementFromRaw(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return 'Saved Part 3 response supplement was not included because the saved Part 3 response is not valid JSON.';
  }
  const normalized = normalizeAsamResponseForFill(parsed);
  const lines = ['SAVED PART 3 RESPONSE SUPPLEMENT'];
  const items = normalized?.case_management?.items || {};
  const itemLines = ASAM_FUNCTIONING_ITEMS.map(item => {
    const value = items[item.key] || {};
    const score = Number.isInteger(value.score) ? `${value.score} ${value.severity || ASAM_FUNCTIONING_LABELS[value.score] || ''}`.trim() : '';
    const rationale = textFromDiagnosticsValue(value.rationale || value.reason || value.clinical_rationale);
    return [item.label, [score, rationale].filter(Boolean).join(' - ')].filter(Boolean).join(': ');
  }).filter(line => /: ./i.test(line));
  if (itemLines.length) lines.push('', 'Case Management Functioning Details', ...itemLines);
  const assessmentSummary = joinAssessmentParagraphs(normalized.assessment_summary || parsed.assessment_summary || parsed?.case_management?.assessment_summary);
  if (assessmentSummary) lines.push('', 'Assessment Summary From Part 3 Response', assessmentSummary);
  const recommendations = normalized.clinical_recommendations || parsed.clinical_recommendations || parsed?.case_management?.clinical_recommendations || {};
  const recommendationLines = DIAGNOSTICS_RECOMMENDATION_ITEMS.map(item => {
    const value = getObjectValueByAliases(recommendations, [item.key, item.label]) ?? {};
    const selected = value?.selected === true || value === true ? 'selected' : value?.selected === false || value === false ? 'not selected' : '';
    const detail = item.key === 'other_services'
      ? textFromDiagnosticsValue(value.services || value.rationale || value)
      : textFromDiagnosticsValue(value.rationale || value.reason || '');
    return [item.label, [selected, detail].filter(Boolean).join(' - ')].filter(Boolean).join(': ');
  }).filter(line => /: ./i.test(line));
  if (recommendationLines.length) lines.push('', 'Clinical Recommendations From Part 3 Response', ...recommendationLines);
  const dsm = textFromDiagnosticsValue(normalized.dsm_v?.sud_diagnoses_only || normalized.dsm_v || parsed.dsm_v);
  if (dsm) lines.push('', 'DSM V From Part 3 Response', dsm);
  const loc = normalized.level_of_care || parsed.level_of_care || {};
  const locText = [
    loc.recommended_level ? `Recommended level: ${textFromDiagnosticsValue(loc.recommended_level)}` : '',
    loc.asam_rationale ? `ASAM rationale: ${textFromDiagnosticsValue(loc.asam_rationale)}` : '',
    loc.why_lower_level_is_not_indicated ? `Why lower level is not indicated: ${textFromDiagnosticsValue(loc.why_lower_level_is_not_indicated)}` : '',
    loc.why_higher_level_is_not_indicated ? `Why higher level is not indicated: ${textFromDiagnosticsValue(loc.why_higher_level_is_not_indicated)}` : '',
    loc.estimated_length_of_time_at_this_level ? `Estimated length: ${textFromDiagnosticsValue(loc.estimated_length_of_time_at_this_level)}` : '',
    loc.estimated_date_of_discharge ? `Estimated discharge: ${textFromDiagnosticsValue(loc.estimated_date_of_discharge)}` : ''
  ].filter(Boolean).join('\n');
  if (locText) lines.push('', 'Level of Care From Part 3 Response', locText);
  return lines.length > 1 ? lines.join('\n') : '';
}
function diagnosticsPromptNoteText() {
  return ($('diagnosticsPromptNote')?.value || '').trim();
}
function formatDiagnosticsPromptNote() {
  const text = diagnosticsPromptNoteText();
  if (!text) return '';
  const punctuated = /[.!?]$/.test(text) ? text : `${text}.`;
  return `NOTE: ${punctuated}`;
}
function applyDiagnosticsPromptNote(promptText) {
  const prompt = String(promptText || '').trim();
  const note = formatDiagnosticsPromptNote();
  if (!note) return prompt;
  return `${note}\n\n${prompt}\n\n${note}`;
}
function resetDiagnosticsPromptPreviewBase() {
  diagnosticsPromptPreviewBase = '';
}
function diagnosticsPromptPreviewFallback(source) {
  return (source.body || '').replace(DIAGNOSTICS_CONTEXT_PLACEHOLDER, '[Click Refresh from active page or Copy prompt to pull Part 3 page context.]');
}
function buildDiagnosticsPromptFromContext(context, { includePromptNote = true } = {}) {
  const source = workflowMode('diagnostics').sourcePrompt;
  if (!source?.body) throw new Error('No Diagnostics Part 4 prompt loaded.');
  const supplement = formatSavedPart3SupplementFromRaw($('asamResp')?.value || '');
  const contextBlock = formatDiagnosticsPart3Context(context, supplement);
  const basePrompt = source.body.includes(DIAGNOSTICS_CONTEXT_PLACEHOLDER)
    ? source.body.replace(DIAGNOSTICS_CONTEXT_PLACEHOLDER, contextBlock)
    : `${source.body}\n\n${contextBlock}`;
  return includePromptNote ? applyDiagnosticsPromptNote(basePrompt) : basePrompt;
}
function renderDiagnosticsPrompt(promptText = '') {
  const source = workflowMode('diagnostics').sourcePrompt;
  if (!$('diagnosticsPromptPreview')) return;
  if (!source) {
    $('diagnosticsPromptMeta').textContent = 'No Diagnostics Part 4 source prompt is loaded.';
    $('diagnosticsPromptPreview').textContent = '';
    return;
  }
  $('diagnosticsPromptMeta').textContent = `${source.title} | ${source.source}`;
  if (promptText) diagnosticsPromptPreviewBase = promptText;
  const previewBase = diagnosticsPromptPreviewBase || diagnosticsPromptPreviewFallback(source);
  $('diagnosticsPromptPreview').textContent = applyDiagnosticsPromptNote(previewBase);
}
function renderMseDefaults() {
  renderReadOnlyDefaultRows('mseDefaultsBody', 'mseDefaultCount', getWorkflowDefaultRows('mse'));
}
function renderMode() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === activeMode);
  });
  $('modeDescription').textContent = modeDescription(activeMode);
  document.querySelectorAll('.mode-panel').forEach(panel => {
    const classes = [...panel.classList];
    const visible = classes.includes(`mode-${activeMode}`);
    panel.classList.toggle('hidden', !visible);
  });
  renderMsePrompt();
  renderAsamPrompt();
  renderDiagnosticsPrompt();
  renderTreatmentPrompt();
  renderMseDefaults();
}
async function saveMode(mode) {
  activeMode = mode || 'bps';
  await chrome.storage.local.set({ [STORAGE_KEYS.mode]: activeMode });
  renderMode();
}
function formatDiscoveryReport(report) {
  if (!report) return 'No discovery scan yet.';
  const pageText = [
    report.title,
    report.url,
    ...(report.sections || []).map(section => section.name),
    ...(report.controls || []).slice(0, 25).map(control => control.contextText || control.label || '')
  ].join(' ');
  const looksLikeQuickNotes = /QuickNotes|QuickGroupNotes|Group Notes/i.test(pageText);
  const hasMseScreenshotTerms = MSE_SCREENSHOT_TERMS.some(term => pageText.includes(term));
  const warnings = [];
  if (looksLikeQuickNotes && !hasMseScreenshotTerms) {
    warnings.push('This scan appears to be QuickNotes / Group Notes, not the MSE Part 2 form shown in Rose screenshots. Open the Mental Health Status Exam form/page before using this as an MSE map.');
  }
  const lines = [
    'ReliaTrax Form Discovery Report',
    '',
    `Page: ${report.title || '(untitled)'}`,
    `URL: ${report.url || ''}`,
    `Scanned: ${report.timestamp || ''}`,
    `Suggested path prefix: ${report.pathPrefix || '(none)'}`,
    `Controls found: ${report.totalControls}`,
    `Visible controls: ${report.visibleControlCount ?? report.totalControls}`,
    `Hidden/collapsed controls: ${report.hiddenControlCount ?? 0}`,
    `Text inputs/textareas/selects: ${report.textLikeCount}`,
    `Checkboxes: ${report.checkboxCount}`,
    `Radios: ${report.radioCount}`,
    ''
  ];
  if (warnings.length) {
    lines.push('Warnings:');
    warnings.forEach(warning => lines.push(`- ${warning}`));
    lines.push('');
  }
  lines.push('Sections:');
  (report.sections || []).forEach(section => {
    lines.push(`- ${section.name}: ${section.controlCount} control${section.controlCount === 1 ? '' : 's'}`);
  });
  if (report.pageSource) {
    lines.push('', 'Page source snapshot:');
    lines.push(`- HTML characters captured: ${Math.min(report.pageSource.htmlLength || 0, report.captureOptions?.maxHtmlChars || report.pageSource.htmlLength || 0)} of ${report.pageSource.htmlLength || 0}${report.pageSource.truncated ? ' (truncated)' : ''}`);
    lines.push(`- Forms: ${(report.pageSource.forms || []).length}`);
    lines.push(`- Stylesheets/style blocks: ${(report.pageSource.stylesheets || []).length}`);
    lines.push(`- Scripts: ${(report.pageSource.scripts || []).length}`);
    lines.push(`- Iframes: ${(report.pageSource.iframes || []).length}`);
  }
  if ((report.interactiveElements || []).length) {
    lines.push('', 'Likely section/tab controls:');
    (report.interactiveElements || []).slice(0, 30).forEach(item => {
      lines.push(`- ${item.index}. ${item.text || item.id || item.role || item.tag} | role: ${item.role || '(none)'} | target: ${item.ariaControls || item.href || '(none)'} | visible: ${item.visible}`);
    });
  }
  if ((report.expansionSnapshots || []).length) {
    lines.push('', 'Section click snapshots:');
    (report.expansionSnapshots || []).forEach(snapshot => {
      lines.push(`- ${snapshot.index}. ${snapshot.text || snapshot.id || snapshot.role || snapshot.tag}: ${snapshot.clicked ? 'clicked' : 'not clicked'} | visible controls after: ${snapshot.afterVisibleControls ?? 'n/a'}`);
      (snapshot.visibleControls || []).slice(0, 8).forEach(control => {
        lines.push(`   - #${control.index} ${control.suggestedPath || control.label || control.type}`);
      });
    });
  }
  lines.push('', 'Controls:');
  (report.controls || []).forEach(control => {
    const options = (control.options || []).length ? ` | options: ${control.options.join(', ')}` : '';
    const required = control.required ? ' | required' : '';
    const visibility = control.seenHidden || control.visibility?.visible === false ? ' | hidden/collapsed' : '';
    lines.push(`${control.index}. [${control.section || 'Unsectioned'}] ${control.label || control.name || control.id || control.type}${visibility}`);
    if (control.questionText) lines.push(`   question: ${[control.questionNumber, control.questionText].filter(Boolean).join('. ')}`);
    if (control.answerText && control.answerText !== control.label) lines.push(`   answer: ${control.answerText}`);
    lines.push(`   type: ${control.type}${required} | suggestedPath: ${control.suggestedPath || ''}${options}`);
    if (control.placeholder) lines.push(`   placeholder: ${control.placeholder}`);
    if (control.name || control.id) lines.push(`   id/name: ${control.id || '(no id)'} / ${control.name || '(no name)'}`);
    if (control.domPath) lines.push(`   dom: ${control.domPath}`);
    if (control.contextText && control.contextText !== control.label) lines.push(`   context: ${control.contextText}`);
  });
  return lines.join('\n');
}
function renderDiscoveryReport() {
  logTo('discoveryResults', discoveryReport ? formatDiscoveryReport(discoveryReport) : 'No discovery scan yet.');
}
function renderVisualMappingButtons() {
  $('showDiscoveryLabels')?.classList.toggle('active-toggle', visualMappingMode === 'labels');
  $('showDiscoveryHoverLabels')?.classList.toggle('active-toggle', visualMappingMode === 'hover');
}
async function appendTrace(entry) {
  traceLog.push({
    ...entry,
    bastionGptResponses: getBastionGptResponsesForTrace()
  });
  await saveTraceLog();
}
function extensionVersion() {
  try {
    return chrome.runtime.getManifest().version || '';
  } catch {
    return '';
  }
}
function n8nUrlFor(kind) {
  if (!N8N_LOGGING_CONFIG.enabled) return '';
  return kind === 'issue' ? N8N_LOGGING_CONFIG.issueUrl : N8N_LOGGING_CONFIG.successUrl;
}
function makeN8nEventId(kind) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `rose-${kind}-${suffix}`;
}
async function postN8nLog(kind, payload) {
  const url = n8nUrlFor(kind);
  if (!url) throw new Error(`n8n ${kind} endpoint is not configured.`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_LOGGING_CONFIG.requestTimeoutMs || 12000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    let body = text;
    try { body = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) throw new Error(`n8n ${kind} endpoint returned ${res.status}: ${text.slice(0, 300)}`);
    return body;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error(`n8n ${kind} request timed out.`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
function workflowNameForMode(mode = activeMode) {
  if (mode === 'bps') return 'BPS Part 1';
  if (mode === 'quicknotes') return 'QuickNotes / Group Notes';
  return modeTitle(mode);
}
async function activeTabForN8n() {
  try {
    const tab = await getActiveTab();
    return {
      title: tab.title || '',
      url: redactUrlForReport(tab.url || ''),
      rawUrlWasRedacted: Boolean(tab.url && redactUrlForReport(tab.url) !== tab.url)
    };
  } catch (err) {
    return compactDiagnosticForReport(ensureDiagnostic(err, {
      workflow: workflowNameForMode(activeMode),
      stage: 'active_tab_lookup'
    }).diagnostic);
  }
}
function summarizeFillResultForN8n(result = {}) {
  return {
    event: result.event || 'fill',
    mode: result.mode || result.workflowMode || activeMode,
    timestamp: result.timestamp || new Date().toISOString(),
    dryRun: Boolean(result.dryRun),
    found: Number(result.found || 0),
    expected: Number(result.expected || 0),
    written: Number(result.written || 0),
    responseWritten: Number(result.responseWritten || 0),
    defaultWritten: Number(result.defaultWritten || 0),
    checkboxWritten: Number(result.checkboxWritten || 0),
    checkboxTrueWritten: Number(result.checkboxTrueWritten || 0),
    checkboxFalseWritten: Number(result.checkboxFalseWritten || 0),
    checkboxWriteFailures: Number(result.checkboxWriteFailures || 0),
    skipped: Number(result.skipped || 0),
    missingCount: Array.isArray(result.missing) ? result.missing.length : Number(result.missingCount || 0),
    warnings: result.warnings || [],
    diagnosticAnnotations: result.diagnosticAnnotations || []
  };
}
function shouldSendSuccessLog(result = {}) {
  if (!N8N_LOGGING_CONFIG.enabled || !N8N_LOGGING_CONFIG.successUrl) return false;
  if (result.error || result.dryRun) return false;
  return Number(result.written || 0) > 0;
}
function recordN8nLoggingError(kind, err) {
  if (!$('n8nSendResults')) return;
  logTo('n8nSendResults', {
    ok: false,
    event: `${kind}_log_failed`,
    timestamp: new Date().toISOString(),
    message: err?.message || String(err)
  });
}
async function sendN8nSuccessLogForFill(mode, result) {
  if (!shouldSendSuccessLog(result)) return null;
  const fill = summarizeFillResultForN8n({ ...result, mode });
  const response = await postN8nLog('success', {
    event_id: makeN8nEventId('success'),
    event_type: 'success',
    timestamp: new Date().toISOString(),
    mode,
    workflowName: workflowNameForMode(mode),
    extensionVersion: extensionVersion(),
    activeTab: await activeTabForN8n(),
    fill,
    warnings: fill.warnings,
    config: configSummary()
  });
  if ($('n8nSendResults')) {
    logTo('n8nSendResults', {
      ok: true,
      event: 'success_logged',
      mode,
      written: fill.written,
      n8n: response
    });
  }
  return response;
}
function queueN8nSuccessLog(mode, result) {
  sendN8nSuccessLogForFill(mode, result).catch(err => recordN8nLoggingError('success', err));
}
function promptForN8n(mode = activeMode) {
  if (mode === 'bps') {
    const prompts = (activeConfig.prompts || []).map((prompt, index) => ({
      index: index + 1,
      id: prompt.id || '',
      title: prompt.title || `Prompt ${index + 1}`,
      text: promptBodyForCopy(prompt.body || '')
    }));
    return {
      mode,
      title: 'BPS Part 1 prompts',
      prompts,
      text: prompts.map(prompt => `${prompt.title}\n\n${prompt.text}`).join('\n\n---\n\n')
    };
  }
  if (mode === 'quicknotes') {
    const prompt = activeQuickNotesConfig?.prompts?.[0] || {};
    return { mode, title: prompt.title || 'QuickNotes prompt', source: prompt.source || '', text: prompt.body || '' };
  }
  if (mode === 'treatment') {
    const prompt = selectedTreatmentPrompt();
    return {
      mode,
      title: prompt?.title || 'Treatment Plan prompt',
      scenario: prompt?.id || '',
      source: treatmentConfig?.source || {},
      text: prompt?.body || ''
    };
  }
  const source = modeSourcePrompt(mode);
  if (!source) return { mode, title: workflowNameForMode(mode), text: '' };
  const text = mode === 'diagnostics'
    ? applyDiagnosticsPromptNote(diagnosticsPromptPreviewBase || diagnosticsPromptPreviewFallback(source))
    : (source.body || '');
  return { mode, title: source.title || workflowNameForMode(mode), source: source.source || '', text };
}
function parseJsonTextForN8n(raw, label) {
  const text = String(raw || '').trim();
  if (!text) return { raw: '', parsed: null, parseError: '' };
  try {
    return { raw: text, parsed: JSON.parse(text), parseError: '' };
  } catch (err) {
    return { raw: text, parsed: null, parseError: `${label}: ${err.message}` };
  }
}
function visiblePanelsForN8n() {
  return Array.from(document.querySelectorAll('pre[id]'))
    .filter(node => node.id !== 'n8nSendResults' && !node.closest('.hidden') && String(node.textContent || '').trim())
    .map(node => ({ id: node.id, text: node.textContent || '' }));
}
function jsonDataForN8n(mode = activeMode) {
  const data = {
    mode,
    traceLog,
    visiblePanels: visiblePanelsForN8n()
  };
  if (mode === 'bps') {
    data.responses = getBastionGptResponsesForTrace();
    try { data.merged = validateAndMerge(); } catch (err) { data.validationError = err.message; }
    return data;
  }
  if (mode === 'quicknotes') {
    data.quicknotes = parseJsonTextForN8n($('quicknotesResp')?.value || '', 'QuickNotes response');
    return data;
  }
  if (mode === 'mse') {
    data.mse = parseJsonTextForN8n($('mseResp')?.value || '', 'MSE Part 2 response');
    try { data.validation = validateMseResponse(); } catch (err) { data.validationError = err.message; }
    return data;
  }
  if (mode === 'asam') {
    data.asam = parseJsonTextForN8n($('asamResp')?.value || '', 'Part 3 response');
    try { data.validation = validateAsamResponse(); } catch (err) { data.validationError = err.message; }
    return data;
  }
  if (mode === 'diagnostics') {
    data.diagnostics = parseJsonTextForN8n($('diagnosticsResp')?.value || '', 'Diagnostics Part 4 response');
    try { data.validation = validateDiagnosticsResponse(); } catch (err) { data.validationError = ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'response_validation' }).diagnostic; }
    return data;
  }
  if (mode === 'treatment') {
    data.treatment = { raw: $('treatmentResp')?.value || '', scenario: selectedTreatmentPrompt()?.id || '' };
    try { data.validation = validateTreatmentResponse(); }
    catch (err) { data.validationError = ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'response_validation' }).diagnostic; }
    data.supportBundle = treatmentSupportBundle;
    return data;
  }
  return data;
}
function runtimeConfigForMode(mode = activeMode) {
  if (mode === 'quicknotes') return buildQuickNotesRuntimeConfig();
  if (mode === 'mse') return buildMseRuntimeConfig();
  if (mode === 'asam') return buildAsamRuntimeConfig();
  if (mode === 'diagnostics') return buildDiagnosticsRuntimeConfig();
  if (mode === 'treatment') return buildTreatmentRuntimeConfig();
  return buildRuntimeConfig();
}
async function webpageDataForN8n(mode = activeMode) {
  const report = {
    activeTab: await activeTabForN8n(),
    scan: null,
    discovery: null
  };
  try {
    report.scan = await runInActiveTab(pageScan, [runtimeConfigForMode(mode)]);
  } catch (err) {
    report.scan = compactDiagnosticForReport(ensureDiagnostic(err, {
      workflow: workflowNameForMode(mode),
      stage: 'page_scan'
    }).diagnostic);
  }
  try {
    report.discovery = await runInActiveTab(pageDiscover, [{
      pathPrefix: mode,
      includeHiddenControls: true,
      capturePageSource: true,
      expandInteractiveSections: false
    }]);
  } catch (err) {
    report.discovery = compactDiagnosticForReport(ensureDiagnostic(err, {
      workflow: workflowNameForMode(mode),
      stage: 'page_discovery'
    }).diagnostic);
  }
  return report;
}
async function buildN8nIssuePayload({ includePrompt, includeJson, includeWebpage }) {
  const payload = {
    event_id: makeN8nEventId('issue'),
    event_type: 'issue',
    timestamp: new Date().toISOString(),
    mode: activeMode,
    workflowName: workflowNameForMode(activeMode),
    extensionVersion: extensionVersion(),
    statusText: $('status')?.textContent || '',
    activeTab: await activeTabForN8n(),
    config: configSummary(),
    issue: {
      category: 'manual_troubleshooting_submission',
      message: $('status')?.textContent || 'Troubleshooting information submitted from the extension.',
      workflow: workflowNameForMode(activeMode)
    },
    included: {
      prompt: Boolean(includePrompt),
      jsonData: Boolean(includeJson),
      webpageData: Boolean(includeWebpage)
    }
  };
  if (includePrompt) payload.prompt = promptForN8n(activeMode);
  if (includeJson) payload.jsonData = jsonDataForN8n(activeMode);
  if (includeWebpage) payload.webpageData = await webpageDataForN8n(activeMode);
  return payload;
}
async function sendN8nTroubleshootingInfo() {
  const button = $('sendTroubleshootingInfo');
  if (button) button.disabled = true;
  try {
    setStatus('Sending troubleshooting information...');
    const payload = await buildN8nIssuePayload({
      includePrompt: Boolean($('n8nIncludePrompt')?.checked),
      includeJson: Boolean($('n8nIncludeJson')?.checked),
      includeWebpage: Boolean($('n8nIncludeWebpage')?.checked)
    });
    const response = await postN8nLog('issue', payload);
    logTo('n8nSendResults', {
      ok: true,
      event: 'troubleshooting_sent',
      sent: payload.included,
      n8n: response
    });
    setStatus('Troubleshooting information sent');
  } catch (err) {
    logTo('n8nSendResults', {
      ok: false,
      event: 'troubleshooting_send_failed',
      message: err?.message || String(err)
    });
    setStatus('Troubleshooting send failed');
  } finally {
    if (button) button.disabled = false;
  }
}
async function fetchRemoteJson(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Remote config URL is not valid. Use a full GitHub raw URL that starts with https://raw.githubusercontent.com/.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_CONFIG_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(parsedUrl.href, { cache: 'no-store', signal: controller.signal });
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'request timed out' : err.message;
    throw new Error(`Unable to fetch remote config from ${parsedUrl.href}. Chrome reported: ${reason}. Check internet access, VPN/firewall filtering, GitHub raw access, and that the URL opens in the same Chrome profile. You can use "Use bundled config" to continue with the packaged config.`);
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}. Confirm the GitHub raw config URL exists and is public or accessible in this Chrome profile.`);
  return res.json();
}
async function fetchRemoteConfig(url) {
  const cfg = await fetchRemoteJson(url);
  if (!Array.isArray(cfg.fieldMap)) throw new Error('Config is missing fieldMap array.');
  return cfg;
}
function renderConfigState() {
  renderPrompts();
  renderQuestionPathOptions();
  renderDefaultRows();
  renderMode();
  renderConfigMeta();
}
async function loadRemoteConfig(url, { preserveDefaultRows = false } = {}) {
  const normalizedUrl = migrateLegacyConfigUrl(url);
  if (!normalizedUrl) throw new Error('Paste a raw GitHub config URL first.');
  const remoteConfig = await fetchRemoteConfig(normalizedUrl);
  const selection = selectBpsConfig(remoteConfig, window.DEFAULT_ROSE_BPS_CONFIG, 'Remote');
  const cfg = selection.config;
  activeConfig = cfg;
  if (!preserveDefaultRows) {
    defaultRows = getConfigDefaultRows(cfg);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: cfg, [STORAGE_KEYS.configUrl]: normalizedUrl, [STORAGE_KEYS.defaultRows]: defaultRows });
  renderConfigState();
  return selection;
}
async function loadRemoteWorkflowConfig(url = DEFAULT_WORKFLOW_CONFIG_URL) {
  const normalizedUrl = migrateLegacyConfigUrl(url);
  if (!normalizedUrl) throw new Error('Paste a raw GitHub config URL first.');
  const cfg = normalizeWorkflowConfigUrls(await fetchRemoteJson(normalizedUrl), normalizedUrl);
  if (!cfg?.modes || typeof cfg.modes !== 'object') throw new Error('Workflow config is missing modes.');
  workflowConfig = cfg;
  resetDiagnosticsPromptPreviewBase();
  await chrome.storage.local.set({ [STORAGE_KEYS.workflowConfig]: cfg });
  renderMode();
}
async function loadRemoteQuickNotesConfig() {
  const url = migrateLegacyConfigUrl(workflowMode('quicknotes').configUrl);
  if (!url) return;
  activeQuickNotesConfig = await fetchRemoteConfig(url);
  await chrome.storage.local.set({ [STORAGE_KEYS.quicknotesConfig]: activeQuickNotesConfig });
}
async function loadRemoteTreatmentConfig(baseUrl = DEFAULT_WORKFLOW_CONFIG_URL) {
  const configured = workflowMode('treatment').promptConfigUrl;
  const url = resolveConfigUrl(configured, baseUrl) || DEFAULT_TREATMENT_CONFIG_URL;
  const config = await fetchRemoteJson(url);
  if (!Array.isArray(config?.prompts) || config.prompts.length !== 4) {
    throw new Error('Treatment Plan prompt config must contain Rose\'s four prompts.');
  }
  treatmentConfig = config;
  activeTreatmentScenario = treatmentPrompts().some(prompt => prompt.id === activeTreatmentScenario)
    ? activeTreatmentScenario
    : treatmentPrompts()[0]?.id || '';
  await chrome.storage.local.set({ [STORAGE_KEYS.treatmentConfig]: config });
  renderTreatmentPrompt();
}
async function loadRemoteConfigBundle(url, options = {}) {
  const warnings = [];
  try {
    await loadRemoteWorkflowConfig(workflowConfigUrlFromConfigUrl(url));
  } catch (err) {
    warnings.push(`Workflow config: ${err.message}`);
  }
  try {
    await loadRemoteQuickNotesConfig();
  } catch (err) {
    warnings.push(`QuickNotes config: ${err.message}`);
  }
  try {
    await loadRemoteTreatmentConfig(workflowConfigUrlFromConfigUrl(url));
  } catch (err) {
    warnings.push(`Treatment Plan prompts: ${err.message}`);
  }
  const bpsSelection = await loadRemoteConfig(url, options);
  if (bpsSelection.warning) warnings.push(`BPS config: ${bpsSelection.warning}`);
  return warnings;
}
async function loadState() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.config,
    STORAGE_KEYS.configUrl,
    STORAGE_KEYS.responses,
    STORAGE_KEYS.defaultRows,
    STORAGE_KEYS.traceLog,
    STORAGE_KEYS.mode,
    STORAGE_KEYS.workflowConfig,
    STORAGE_KEYS.treatmentConfig,
    STORAGE_KEYS.quicknotesConfig,
    STORAGE_KEYS.discoveryReport,
    STORAGE_KEYS.discoveryPrefix,
    STORAGE_KEYS.quicknotesResponse,
    STORAGE_KEYS.mseResponse,
    STORAGE_KEYS.asamResponse,
    STORAGE_KEYS.diagnosticsResponse,
    STORAGE_KEYS.diagnosticsPromptNote,
    STORAGE_KEYS.treatmentResponse,
    STORAGE_KEYS.treatmentScenario,
    STORAGE_KEYS.treatmentSupportBundle
  ]);
  const savedBpsSelection = selectBpsConfig(data[STORAGE_KEYS.config], window.DEFAULT_ROSE_BPS_CONFIG, 'Saved');
  activeConfig = savedBpsSelection.config;
  workflowConfig = normalizeWorkflowConfigUrls(data[STORAGE_KEYS.workflowConfig] || window.DEFAULT_ROSE_WORKFLOW_CONFIG || workflowConfig);
  treatmentConfig = data[STORAGE_KEYS.treatmentConfig] || window.DEFAULT_ROSE_TREATMENT_CONFIG || treatmentConfig;
  activeQuickNotesConfig = data[STORAGE_KEYS.quicknotesConfig] || window.DEFAULT_ROSE_QUICKNOTES_CONFIG || activeQuickNotesConfig;
  defaultRows = Array.isArray(data[STORAGE_KEYS.defaultRows]) ? data[STORAGE_KEYS.defaultRows] : getConfigDefaultRows(activeConfig);
  traceLog = Array.isArray(data[STORAGE_KEYS.traceLog]) ? data[STORAGE_KEYS.traceLog] : [];
  activeMode = data[STORAGE_KEYS.mode] || 'bps';
  discoveryReport = data[STORAGE_KEYS.discoveryReport] || null;
  activeTreatmentScenario = data[STORAGE_KEYS.treatmentScenario] || treatmentPrompts()[0]?.id || '';
  treatmentSupportBundle = data[STORAGE_KEYS.treatmentSupportBundle] || null;
  if (savedBpsSelection.warning && data[STORAGE_KEYS.config]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.config]: activeConfig });
  }
  const storedConfigUrl = data[STORAGE_KEYS.configUrl];
  const configUrl = migrateLegacyConfigUrl(storedConfigUrl || workflowMode('bps').configUrl || DEFAULT_REMOTE_CONFIG_URL);
  try {
    await loadRemoteWorkflowConfig(workflowConfigUrlFromConfigUrl(configUrl));
  } catch {
    workflowConfig = normalizeWorkflowConfigUrls(window.DEFAULT_ROSE_WORKFLOW_CONFIG || workflowConfig);
  }
  try {
    await loadRemoteQuickNotesConfig();
  } catch {
    activeQuickNotesConfig = window.DEFAULT_ROSE_QUICKNOTES_CONFIG || activeQuickNotesConfig;
  }
  try {
    await loadRemoteTreatmentConfig(workflowConfigUrlFromConfigUrl(configUrl));
  } catch {
    treatmentConfig = window.DEFAULT_ROSE_TREATMENT_CONFIG || treatmentConfig;
  }
  if (storedConfigUrl && configUrl !== storedConfigUrl) {
    await chrome.storage.local.set({ [STORAGE_KEYS.configUrl]: configUrl });
  }
  $('configUrl').value = configUrl;
  $('discoveryPrefix').value = data[STORAGE_KEYS.discoveryPrefix] || '';
  if ($('quicknotesResp')) $('quicknotesResp').value = data[STORAGE_KEYS.quicknotesResponse] || '';
  if ($('mseResp')) $('mseResp').value = data[STORAGE_KEYS.mseResponse] || '';
  if ($('asamResp')) $('asamResp').value = data[STORAGE_KEYS.asamResponse] || '';
  if ($('diagnosticsResp')) $('diagnosticsResp').value = data[STORAGE_KEYS.diagnosticsResponse] || '';
  if ($('diagnosticsPromptNote')) $('diagnosticsPromptNote').value = data[STORAGE_KEYS.diagnosticsPromptNote] || '';
  if ($('treatmentResp')) $('treatmentResp').value = data[STORAGE_KEYS.treatmentResponse] || '';
  if ($('treatmentTroubleshooting')) logTo('treatmentTroubleshooting', treatmentSupportBundle || 'No Treatment Plan support bundle yet.');
  (data[STORAGE_KEYS.responses] || []).forEach((v, i) => { if ($(`resp${i+1}`)) $(`resp${i+1}`).value = v || ''; });
  [1, 2, 3, 4].forEach(refreshBpsResponseWarning);
  renderTraceLog();
  renderDiscoveryReport();
  renderVisualMappingButtons();
  renderMode();
  try {
    setStatus('Loading remote config...');
    const selection = await loadRemoteConfig(configUrl, { preserveDefaultRows: Array.isArray(data[STORAGE_KEYS.defaultRows]) });
    const message = selection.warning ? 'Bundled BPS config retained' : 'Remote config loaded';
    logConfigResult({
      ok: true,
      event: selection.warning ? 'startup_remote_bps_config_rejected' : 'startup_remote_config_loaded',
      configUrl,
      configSource: selection.source,
      warning: selection.warning,
      ...configSummary()
    }, message);
    setStatus(selection.warning ? 'Bundled BPS config retained; remote BPS config is older or unsafe' : 'Remote config loaded');
  } catch (err) {
    renderConfigState();
    logConfigResult({
      ok: false,
      event: 'startup_remote_config_unavailable',
      configUrl,
      message: err.message,
      fallback: 'Using bundled config and any already saved workflow config.'
    }, 'Remote config unavailable');
    setStatus('Remote config unavailable');
    logTo('validation', err.message);
  }
}
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found.');
  return tab;
}
async function getActiveTabId() {
  return (await getActiveTab()).id;
}
function activeTabScriptDiagnostic(tab, err, workflow = 'Active page') {
  const url = tab?.url || '';
  const message = String(err?.message || err || '');
  const isRestrictedPage = /^(chrome|chrome-extension|edge|about):/i.test(url) || /cannot access contents|chrome:\/\/|extensions gallery/i.test(message);
  const isPermissionIssue = /permission|Cannot access|not allowed|host/i.test(message);
  const isReliaTraxLike = /reliatrax|localhost|127\.0\.0\.1/i.test(url);
  const likelyCause = isRestrictedPage
    ? 'Chrome will not let extensions run fill scripts on this kind of tab.'
    : isPermissionIssue
      ? 'Chrome blocked the extension from running on the active tab.'
      : !isReliaTraxLike
        ? 'The active tab does not look like a ReliaTrax form page.'
        : 'The active ReliaTrax page changed or was not ready when the extension tried to scan or fill it.';
  const wrapped = new Error(message);
  wrapped.diagnostic = {
    ok: false,
    source: 'Active Chrome tab',
    stage: 'active_tab_script',
    category: isRestrictedPage ? 'restricted_page' : isPermissionIssue ? 'extension_permission_or_access' : 'active_page_script_error',
    blocking: true,
    workflow,
    message: `We don't know exactly what went wrong, but ${likelyCause}`,
    chromeMessage: message,
    activeTab: {
      title: tab?.title || '',
      url: redactUrlForReport(url),
      rawUrlWasRedacted: Boolean(url && redactUrlForReport(url) !== url)
    },
    nextAction: 'Make the Diagnostics / Clinical Impressions Part 4 ReliaTrax page the active tab, wait for it to finish loading, then click Scan active page before filling.'
  };
  return wrapped;
}
async function runInActiveTab(func, args) {
  const tab = await getActiveTab();
  try {
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args });
    if (result?.result?.error) throw new Error(result.result.error);
    return result?.result;
  } catch (err) {
    throw activeTabScriptDiagnostic(tab, err, activeMode === 'diagnostics' ? 'Diagnostics Part 4' : modeTitle(activeMode));
  }
}
function pageScan(config) {
  try {
    const selector = config.selector || 'textarea.qn-textarea, input.qn-editable-cb';
    const isVisible = (el) => {
      if (!config.onlyVisibleControls) return true;
      if (el.type === 'hidden' || el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const fields = [...document.querySelectorAll(selector)].filter(isVisible);
    const describe = (el, i) => ({
      fillIndex: i,
      tag: el.tagName,
      type: el.type || '',
      id: el.id || '',
      name: el.name || '',
      className: String(el.className || ''),
      valuePreview: (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : String(el.value || '').slice(0, 120),
      contextText: String((el.closest('tr, .question, .form-group, label, div') || el.parentElement || el).innerText || '').replace(/\s+/g, ' ').slice(0, 220)
    });
    const dataQnFieldIdForElement = (el) => el?.getAttribute?.('data-qn-field-id') || el?.closest?.('[data-qn-field-id]')?.getAttribute('data-qn-field-id') || '';
    return {
      event: 'scan',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      selector,
      found: fields.length,
      expected: config.expectedFieldCount,
      mappedFieldCount: Array.isArray(config.fieldMap) ? config.fieldMap.length : 0,
      mappedDataQnFieldIdsFound: (config.fieldMap || [])
        .map(item => String(item.dataQnFieldId || '').trim())
        .filter(Boolean)
        .filter(id => fields.some(field => dataQnFieldIdForElement(field) === id)).length,
      missingMappedDataQnFieldIds: (config.fieldMap || [])
        .map(item => String(item.dataQnFieldId || '').trim())
        .filter(Boolean)
        .filter(id => !fields.some(field => dataQnFieldIdForElement(field) === id)),
      first: fields.slice(0, 5).map((el, i) => describe(el, i)),
      last: fields.slice(-5).map((el, offset) => describe(el, fields.length - 5 + offset))
    };
  } catch (err) { return { error: err.message }; }
}
function pageExtractDiagnosticsPart3Context() {
  try {
    const functioningRows = [
      { key: 'housing', label: 'Housing', firstFieldId: 10451 },
      { key: 'financial_stressors', label: 'Financial Stressors', firstFieldId: 10455 },
      { key: 'legal', label: 'Legal', firstFieldId: 10459 },
      { key: 'employment', label: 'Employment', firstFieldId: 10463 },
      { key: 'education_vocation', label: 'Education/Vocation', firstFieldId: 10467 },
      { key: 'independent_living', label: 'Independent Living', firstFieldId: 10471 },
      { key: 'medical', label: 'Medical', firstFieldId: 10475 },
      { key: 'social_natural_supports', label: 'Social/Natural Supports', firstFieldId: 10479 }
    ];
    const functioningLabels = ['None', 'Mild', 'Moderate', 'Severe'];
    const dimensionTitles = [
      'Acute Intoxication And/or Withdrawal Potential',
      'Biomedical Conditions and Complications',
      'Emotional, Behavioral, or Cognitive Conditions and Complications',
      'Readiness to Change',
      'Relapse, Continued Use, or Continued Problem Potential',
      'Recovery/Living Environment'
    ];
    const dimensionFieldIds = [10483, 10484, 10485, 10486, 10487, 10488];
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const controlByFieldId = (fieldId) => {
      const holder = document.querySelector(`[data-qn-field-id="${fieldId}"]`);
      if (!holder) return null;
      if (holder.matches('textarea, select, input, [contenteditable="true"]')) return holder;
      return holder.querySelector('textarea, select, input, [contenteditable="true"]');
    };
    const valueByFieldId = (fieldId) => {
      const el = controlByFieldId(fieldId);
      if (!el) return '';
      if (el.getAttribute('contenteditable') === 'true') return String(el.textContent || '');
      if ((el.type || '').toLowerCase() === 'checkbox') return el.checked ? 'checked' : '';
      return String(el.value || '');
    };
    const warnings = [];
    const functioning = functioningRows.map(row => {
      const selected = functioningLabels.map((severity, index) => {
        const fieldId = String(row.firstFieldId + index);
        const el = controlByFieldId(fieldId);
        if (!el) warnings.push(`Missing Functioning control ${row.label} ${severity} (${fieldId})`);
        return { score: index, severity, fieldId, checked: Boolean(el?.checked) };
      }).filter(item => item.checked);
      const firstSelected = selected[0] || null;
      return {
        key: row.key,
        label: row.label,
        score: firstSelected?.score ?? '',
        severity: firstSelected?.severity || '',
        selectedCount: selected.length,
        selectedFieldIds: selected.map(item => item.fieldId)
      };
    });
    const dimensions = dimensionFieldIds.map((fieldId, index) => {
      const text = valueByFieldId(String(fieldId));
      if (!controlByFieldId(String(fieldId))) warnings.push(`Missing ASAM Dimension ${index + 1} textbox (${fieldId})`);
      return {
        dimension: index + 1,
        title: dimensionTitles[index],
        fieldId: String(fieldId),
        text
      };
    });
    const safetyNeeded = valueByFieldId('10489');
    const safetyWhy = valueByFieldId('10490');
    if (!controlByFieldId('10489')) warnings.push('Missing safety planning needed textbox (10489)');
    if (!controlByFieldId('10490')) warnings.push('Missing safety planning why textbox (10490)');
    return {
      event: 'diagnostics_part3_context',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      functioning,
      dimensions,
      safety_planning: {
        additional_safety_planning_needed: safetyNeeded,
        why_or_why_not: safetyWhy
      },
      warnings: [
        ...warnings,
        ...functioning.filter(item => item.selectedCount > 1).map(item => `${item.label} has multiple Functioning selections checked.`),
        ...functioning.filter(item => item.selectedCount === 0).map(item => `${item.label} has no Functioning selection checked.`),
        ...dimensions.filter(item => !normalize(item.text)).map(item => `Dimension ${item.dimension} textbox is blank.`)
      ]
    };
  } catch (err) { return { error: err.message }; }
}
function pageExtractTreatmentPlanContext() {
  try {
    const selector = 'textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), [contenteditable="true"]';
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const treatmentRoot = [...document.querySelectorAll('#notePanels .notePanel, #notePanels .quickNoteFormBlock')]
      .find(root => /\b(service plan standardized form|problem\s*#\s*1)\b/i.test(normalize(root.innerText || root.textContent || ''))) ||
      document;
    const controls = [...treatmentRoot.querySelectorAll(selector)];
    const valueOf = (el) => {
      if (!el) return '';
      if (el.getAttribute('contenteditable') === 'true') return String(el.textContent || '').trim();
      if (['checkbox', 'radio'].includes(String(el.type || '').toLowerCase())) return el.checked ? 'checked' : '';
      return String(el.value || '').trim();
    };
    const controlSummary = (el, index) => {
      const row = el.closest('tr');
      const cell = el.closest('td, th');
      const precedingCells = [];
      for (let previous = cell?.previousElementSibling; previous; previous = previous.previousElementSibling) {
        const text = normalize(previous.innerText || previous.textContent || '');
        if (text) precedingCells.unshift(text);
      }
      return {
        index,
        tag: el.tagName,
        type: el.type || '',
        id: el.id || '',
        name: el.name || '',
        dataQnFieldId: el.getAttribute('data-qn-field-id') || el.closest('[data-qn-field-id]')?.getAttribute('data-qn-field-id') || '',
        value: valueOf(el),
        precedingCellText: precedingCells.join(' | '),
        rowText: normalize(row?.innerText || row?.textContent || ''),
        contextText: normalize((row || el.closest('.question, .form-group, label, div') || el.parentElement || el).innerText || '')
      };
    };
    const summaries = controls.map(controlSummary);
    const byDataQnFieldId = (fieldId) => summaries.find(item => item.dataQnFieldId === String(fieldId));
    const scoredDate = (kind) => summaries.map(item => {
      const local = `${item.precedingCellText} ${item.rowText}`.toLowerCase();
      let score = 0;
      if (kind === 'assessment' && /\bassessment date\b/.test(local)) score += 100;
      if (kind === 'service' && /\bdate of service plan\b/.test(local)) score += 100;
      if (kind === 'assessment' && /\bdate of service plan\b/.test(item.precedingCellText.toLowerCase()) && !/\bassessment date\b/.test(item.precedingCellText.toLowerCase())) score -= 200;
      if (kind === 'service' && /\bassessment date\b/.test(item.precedingCellText.toLowerCase()) && !/\bdate of service plan\b/.test(item.precedingCellText.toLowerCase())) score -= 200;
      return { item, score };
    }).filter(candidate => candidate.score > 0).sort((a, b) => b.score - a.score || a.item.index - b.item.index)[0]?.item;
    const staticValueAfterLabel = (pattern) => {
      for (const cell of treatmentRoot.querySelectorAll('td, th')) {
        const label = normalize(cell.innerText || cell.textContent || '');
        if (!pattern.test(label)) continue;
        const valueCell = cell.nextElementSibling;
        const value = normalize(valueCell?.innerText || valueCell?.textContent || '');
        if (!value) continue;
        return {
          index: -1,
          tag: valueCell.tagName || '',
          type: 'static',
          id: valueCell.id || '',
          name: '',
          dataQnFieldId: valueCell.getAttribute?.('data-qn-field-id') || '',
          value,
          precedingCellText: label,
          rowText: normalize(cell.closest('tr')?.innerText || cell.closest('tr')?.textContent || ''),
          contextText: normalize(cell.closest('tr')?.innerText || cell.closest('tr')?.textContent || '')
        };
      }
      return null;
    };
    const assessment = byDataQnFieldId('10000') || scoredDate('assessment');
    const service = staticValueAfterLabel(/^date of service plan\s*:?$/i) || scoredDate('service');
    const nextReview = staticValueAfterLabel(/^next review on or before\s*:?$/i);
    return {
      event: 'treatment_plan_context',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      controlCount: controls.length,
      assessmentDate: assessment?.value || '',
      dateOfServicePlan: service?.value || '',
      nextReviewDate: nextReview?.value || '',
      assessmentDateControl: assessment || null,
      dateOfServicePlanControl: service || null,
      nextReviewDateControl: nextReview || null,
      treatmentTextPresent: /treatment plan|problem\s*#\s*1|safety planning/i.test(normalize(document.body?.innerText || '')),
      warnings: [
        ...(!assessment ? ['Assessment Date control was not identified.'] : []),
        ...(!service ? ['Date of Service Plan control was not identified.'] : []),
        ...(service && !service.value ? ['Date of Service Plan is blank.'] : []),
        ...(!nextReview ? ['Read-only Next Review value was not identified.'] : [])
      ]
    };
  } catch (err) { return { error: err.message }; }
}
async function pageDiscover(options = {}) {
  try {
    const includeHiddenControls = Boolean(options.includeHiddenControls);
    const capturePageSource = Boolean(options.capturePageSource);
    const expandInteractiveSections = Boolean(options.expandInteractiveSections);
    const maxHtmlChars = Number(options.maxHtmlChars || 5000000);
    const maxSectionClicks = Number(options.maxSectionClicks || 12);
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const slugify = (value) => normalize(value)
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    const visible = (el) => {
      if (el.type === 'hidden' || el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const visibilityInfo = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        visible: visible(el),
        hiddenAttribute: Boolean(el.hidden),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    };
    const domPathFor = (el) => {
      const parts = [];
      let current = el;
      while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          part += `#${current.id}`;
          parts.unshift(part);
          break;
        }
        const className = String(current.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (className) part += `.${className}`;
        const parent = current.parentElement;
        if (parent) {
          const sameTag = [...parent.children].filter(child => child.tagName === current.tagName);
          if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
        }
        parts.unshift(part);
        current = parent;
      }
      return parts.join(' > ');
    };
    const attributesFor = (el) => {
      const important = [
        'id', 'name', 'class', 'type', 'value', 'placeholder', 'role', 'aria-label', 'aria-labelledby',
        'aria-controls', 'aria-expanded', 'data-qn-field-id', 'data-toggle', 'data-bs-toggle', 'href'
      ];
      const attrs = {};
      important.forEach(name => {
        const value = el.getAttribute(name);
        if (value !== null && value !== '') attrs[name] = value;
      });
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith('data-') && attrs[attr.name] === undefined) attrs[attr.name] = attr.value;
      });
      return attrs;
    };
    const htmlSnippetFor = (el) => normalize(el.outerHTML).slice(0, 1200);
    const labelFor = (el) => {
      const labels = [];
      if (el.id) {
        const explicit = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (explicit) labels.push(normalize(explicit.innerText || explicit.textContent));
      }
      if (el.labels) [...el.labels].forEach(label => labels.push(normalize(label.innerText || label.textContent)));
      const wrappingLabel = el.closest('label');
      if (wrappingLabel) labels.push(normalize(wrappingLabel.innerText || wrappingLabel.textContent));
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) labels.push(normalize(ariaLabel));
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        labelledBy.split(/\s+/).forEach(id => {
          const ref = document.getElementById(id);
          if (ref) labels.push(normalize(ref.innerText || ref.textContent));
        });
      }
      return labels.find(Boolean) || '';
    };
    const tableQuestionFor = (el) => {
      const cell = el.closest('td, th');
      const row = cell?.closest('tr');
      if (!cell || !row) return null;
      let currentRow = row;
      for (let depth = 0; currentRow && depth < 12; depth++, currentRow = currentRow.previousElementSibling) {
        const cells = [...currentRow.cells || []];
        const numberCellIndex = cells.findIndex(item => /^\d+\.?$/.test(normalize(item.innerText || item.textContent)));
        if (numberCellIndex === -1) continue;
        const titleCell = cells.slice(numberCellIndex + 1).find(item => {
          const text = normalize(item.innerText || item.textContent);
          return text && !item.querySelector('input, textarea, select, [contenteditable="true"]');
        });
        const title = normalize(titleCell?.innerText || titleCell?.textContent);
        if (title) {
          return {
            number: normalize(cells[numberCellIndex].innerText || cells[numberCellIndex].textContent).replace(/\.$/, ''),
            text: title
          };
        }
      }
      return null;
    };
    const tableAnswerTextFor = (el) => {
      const type = (el.type || '').toLowerCase();
      if (el.tagName !== 'TEXTAREA' && el.getAttribute('contenteditable') !== 'true' && type !== 'text') return '';
      const cell = el.closest('td, th');
      const previousCells = [];
      for (let current = cell?.previousElementSibling; current; current = current.previousElementSibling) {
        previousCells.unshift(current);
      }
      const previousLabel = previousCells.map(item => normalize(item.innerText || item.textContent)).filter(Boolean).pop();
      if (!previousLabel) return '';
      return /other:?$/i.test(previousLabel) ? 'Other text' : previousLabel;
    };
    const fieldIdFor = (el) => el.getAttribute('data-qn-field-id') || el.closest('[data-qn-field-id]')?.getAttribute('data-qn-field-id') || '';
    const nearestHeading = (el) => {
      const fieldset = el.closest('fieldset');
      const legend = fieldset?.querySelector('legend');
      if (legend) return normalize(legend.innerText || legend.textContent);
      let current = el.parentElement;
      for (let depth = 0; current && depth < 6; depth++, current = current.parentElement) {
        const heading = current.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > [role="heading"], :scope > .section-title, :scope > .question-title');
        if (heading) return normalize(heading.innerText || heading.textContent);
      }
      const previousHeadings = [...document.querySelectorAll('h1, h2, h3, h4, [role="heading"], legend')].filter(heading => heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const previousHeading = previousHeadings.pop();
      return normalize(previousHeading?.innerText || previousHeading?.textContent || '');
    };
    const nearbyText = (el) => normalize((el.closest('tr, li, fieldset, .question, .form-group, .field, .row, label, div') || el.parentElement || el).innerText || '');
    const optionText = (el) => {
      const type = (el.type || '').toLowerCase();
      if (el.tagName === 'SELECT') return [...el.options].map(option => normalize(option.textContent || option.value)).filter(Boolean).slice(0, 30);
      if (type === 'checkbox' || type === 'radio') {
        const groupName = el.name;
        const group = groupName ? [...document.querySelectorAll(`input[type="${type}"][name="${CSS.escape(groupName)}"]`)] : [el];
        return [...new Set(group.map(item => labelFor(item) || item.value || item.id || item.name).map(normalize).filter(Boolean))].slice(0, 30);
      }
      return [];
    };
    const controlSelector = [
      'textarea',
      'select',
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',
      '[contenteditable="true"]'
    ].join(',');
    const prefix = slugify(options.pathPrefix || '');
    const discovered = [];
    const seenControls = new Map();
    const describeControl = (el, indexHint) => {
      const type = el.tagName === 'TEXTAREA'
        ? 'textarea'
        : el.tagName === 'SELECT'
          ? 'select'
          : el.getAttribute('contenteditable') === 'true'
            ? 'contenteditable'
            : (el.type || 'text').toLowerCase();
      const section = nearestHeading(el) || 'Unsectioned';
      const label = labelFor(el);
      const tableQuestion = tableQuestionFor(el);
      const questionText = tableQuestion?.text || '';
      const answerText = label || tableAnswerTextFor(el) || normalize(el.getAttribute('aria-label') || el.placeholder || el.value || '');
      const localContext = nearbyText(el);
      const questionContext = [tableQuestion ? `${tableQuestion.number}. ${tableQuestion.text}` : '', localContext].filter(Boolean).join(' | ');
      const contextText = (questionContext || localContext).slice(0, 320);
      const fallbackName = el.name || el.id || el.placeholder || label || contextText || `${type}_${indexHint + 1}`;
      const basePath = [slugify(questionText || section), slugify(answerText || fallbackName)].filter(Boolean).join('.');
      return {
        index: indexHint,
        fillIndex: indexHint,
        tag: el.tagName.toLowerCase(),
        type,
        section,
        questionNumber: tableQuestion?.number || '',
        questionText,
        answerText,
        label,
        id: el.id || '',
        name: el.name || '',
        placeholder: el.placeholder || '',
        required: Boolean(el.required || el.getAttribute('aria-required') === 'true'),
        disabled: Boolean(el.disabled),
        readOnly: Boolean(el.readOnly),
        valuePreview: type === 'checkbox' || type === 'radio' ? Boolean(el.checked) : String(el.value || '').slice(0, 120),
        options: optionText(el),
        suggestedPath: [prefix, basePath || `${type}_${indexHint + 1}`].filter(Boolean).join('.'),
        selectorHints: {
          id: el.id ? `#${el.id}` : '',
          name: el.name ? `[name="${el.name}"]` : '',
          dataQnFieldId: fieldIdFor(el)
        },
        visibility: visibilityInfo(el),
        domPath: domPathFor(el),
        attributes: attributesFor(el),
        htmlSnippet: htmlSnippetFor(el),
        capturedIn: [],
        seenHidden: false,
        contextText
      };
    };
    const controlKeyFor = (control) => [
      control.selectorHints.dataQnFieldId,
      control.id,
      control.name,
      control.domPath,
      control.type,
      control.label,
      control.questionText,
      control.answerText
    ].filter(Boolean).join('|');
    const collectControls = (captureName) => {
      const controls = [...document.querySelectorAll(controlSelector)]
        .filter(el => includeHiddenControls || visible(el));
      const current = controls.map((el, index) => {
        const control = describeControl(el, index);
        const key = controlKeyFor(control);
        const existing = seenControls.get(key);
        if (existing) {
          existing.capturedIn.push(captureName);
          existing.seenHidden = existing.seenHidden || !control.visibility.visible;
          existing.visibility = control.visibility;
          return existing;
        }
        control.index = discovered.length;
        control.fillIndex = discovered.length;
        control.capturedIn.push(captureName);
        control.seenHidden = !control.visibility.visible;
        discovered.push(control);
        seenControls.set(key, control);
        return control;
      });
      return current;
    };
    const controlSummary = (controls) => controls
      .filter(control => control.visibility.visible)
      .slice(0, 40)
      .map(control => ({
        index: control.index,
        type: control.type,
        section: control.section,
        label: control.label,
        questionText: control.questionText,
        answerText: control.answerText,
        suggestedPath: control.suggestedPath
      }));
    const safeClickCandidate = (el) => {
      if (!visible(el)) return false;
      const tag = el.tagName.toLowerCase();
      const type = (el.type || '').toLowerCase();
      const href = el.getAttribute('href') || '';
      const role = el.getAttribute('role') || '';
      const toggle = el.getAttribute('data-toggle') || el.getAttribute('data-bs-toggle') || '';
      const hasPanelTarget = Boolean(el.getAttribute('aria-controls') || /^#[-\w:.]+$/.test(href));
      const text = normalize(el.innerText || el.textContent);
      const looksLikeSectionNav = /section|part|criteria|diagnostic|treatment|assessment|exam|asam|mse|notes|intake|plan|tab/i.test(text);
      if (tag === 'button' && !['submit', 'reset'].includes(type) && (hasPanelTarget || toggle || role || looksLikeSectionNav)) return true;
      if (role === 'tab' || (role === 'button' && (hasPanelTarget || toggle || looksLikeSectionNav))) return true;
      if (/collapse|tab|pill|accordion/i.test(toggle)) return true;
      return tag === 'a' && hasPanelTarget;
    };
    const describeInteractive = (el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      text: normalize(el.innerText || el.textContent).slice(0, 160),
      id: el.id || '',
      role: el.getAttribute('role') || '',
      href: el.getAttribute('href') || '',
      ariaControls: el.getAttribute('aria-controls') || '',
      ariaExpanded: el.getAttribute('aria-expanded') || '',
      dataToggle: el.getAttribute('data-toggle') || el.getAttribute('data-bs-toggle') || '',
      visible: visible(el),
      domPath: domPathFor(el)
    });
    const interactiveElements = [...document.querySelectorAll('button, [role="tab"], [role="button"], [aria-controls], [data-toggle], [data-bs-toggle], a[href^="#"]')]
      .map(describeInteractive);
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    collectControls('initial');
    const expansionSnapshots = [];
    if (expandInteractiveSections) {
      const candidates = [...document.querySelectorAll('button, [role="tab"], [role="button"], [aria-controls], [data-toggle], [data-bs-toggle], a[href^="#"]')]
        .filter(safeClickCandidate)
        .slice(0, maxSectionClicks);
      for (const [index, candidate] of candidates.entries()) {
        const beforeVisible = discovered.filter(control => control.visibility.visible).length;
        const summary = describeInteractive(candidate, index);
        try {
          candidate.click();
          await wait(180);
          const afterControls = collectControls(`section_click_${index + 1}`);
          expansionSnapshots.push({
            ...summary,
            clicked: true,
            beforeVisibleControls: beforeVisible,
            afterVisibleControls: afterControls.filter(control => control.visibility.visible).length,
            visibleControls: controlSummary(afterControls)
          });
        } catch (err) {
          expansionSnapshots.push({ ...summary, clicked: false, error: err.message });
        }
      }
    }
    const sectionCounts = new Map();
    discovered.forEach(control => {
      sectionCounts.set(control.section, (sectionCounts.get(control.section) || 0) + 1);
    });
    const pageHtml = capturePageSource ? `<!doctype html>\n${document.documentElement.outerHTML}` : '';
    const pageText = capturePageSource ? normalize(document.body?.innerText || '').slice(0, 200000) : '';
    const pageSource = capturePageSource ? {
      doctype: document.doctype ? `<!DOCTYPE ${document.doctype.name}>` : '',
      htmlLength: pageHtml.length,
      truncated: pageHtml.length > maxHtmlChars,
      html: pageHtml.slice(0, maxHtmlChars),
      textLength: normalize(document.body?.innerText || '').length,
      text: pageText,
      forms: [...document.forms].map((form, index) => ({
        index,
        id: form.id || '',
        name: form.getAttribute('name') || '',
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || '',
        controlCount: form.querySelectorAll(controlSelector).length,
        domPath: domPathFor(form)
      })),
      stylesheets: [...document.querySelectorAll('link[rel~="stylesheet"], style')].slice(0, 80).map((el, index) => ({
        index,
        tag: el.tagName.toLowerCase(),
        href: el.href || '',
        id: el.id || '',
        textLength: el.tagName === 'STYLE' ? String(el.textContent || '').length : 0
      })),
      scripts: [...document.scripts].slice(0, 80).map((script, index) => ({
        index,
        src: script.src || '',
        id: script.id || '',
        type: script.type || '',
        textLength: String(script.textContent || '').length
      })),
      iframes: [...document.querySelectorAll('iframe')].map((frame, index) => ({
        index,
        id: frame.id || '',
        name: frame.name || '',
        src: frame.src || '',
        title: frame.title || '',
        visible: visible(frame),
        domPath: domPathFor(frame)
      }))
    } : null;
    const typeCount = (types) => discovered.filter(control => types.includes(control.type)).length;
    return {
      event: 'discover',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      pathPrefix: options.pathPrefix || '',
      captureOptions: {
        includeHiddenControls,
        capturePageSource,
        expandInteractiveSections,
        maxHtmlChars,
        maxSectionClicks
      },
      totalControls: discovered.length,
      visibleControlCount: discovered.filter(control => control.visibility.visible).length,
      hiddenControlCount: discovered.filter(control => control.seenHidden || !control.visibility.visible).length,
      textLikeCount: typeCount(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'contenteditable', 'search', 'url']),
      checkboxCount: typeCount(['checkbox']),
      radioCount: typeCount(['radio']),
      interactiveElements,
      expansionSnapshots,
      pageSource,
      sections: [...sectionCounts.entries()].map(([name, controlCount]) => ({ name, controlCount })),
      controls: discovered
    };
  } catch (err) { return { error: err.message }; }
}
function pageVisualMapping(options = {}) {
  const stateKey = '__roseDiscoveryVisualMapping';
  const cleanup = () => {
    const state = window[stateKey];
    if (!state) return;
    state.elements.forEach(({ el, outline, boxShadow, scrollMarginTop }) => {
      el.style.outline = outline;
      el.style.boxShadow = boxShadow;
      el.style.scrollMarginTop = scrollMarginTop;
    });
    state.listeners.forEach(({ el, enter, leave }) => {
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
      el.removeEventListener('focus', enter);
      el.removeEventListener('blur', leave);
    });
    window.removeEventListener('scroll', state.reposition, true);
    window.removeEventListener('resize', state.reposition);
    state.root?.remove();
    window[stateKey] = null;
  };
  try {
    cleanup();
    if (options.action === 'hide') {
      return { event: 'visual_mapping', mode: 'off', controls: 0 };
    }
    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const slugify = (value) => normalize(value)
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    const visible = (el) => {
      if (el.type === 'hidden' || el.hidden) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const labelFor = (el) => {
      const labels = [];
      if (el.id) {
        const explicit = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (explicit) labels.push(normalize(explicit.innerText || explicit.textContent));
      }
      if (el.labels) [...el.labels].forEach(label => labels.push(normalize(label.innerText || label.textContent)));
      const wrappingLabel = el.closest('label');
      if (wrappingLabel) labels.push(normalize(wrappingLabel.innerText || wrappingLabel.textContent));
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) labels.push(normalize(ariaLabel));
      return labels.find(Boolean) || '';
    };
    const tableQuestionFor = (el) => {
      const cell = el.closest('td, th');
      const row = cell?.closest('tr');
      if (!cell || !row) return null;
      let currentRow = row;
      for (let depth = 0; currentRow && depth < 12; depth++, currentRow = currentRow.previousElementSibling) {
        const cells = [...currentRow.cells || []];
        const numberCellIndex = cells.findIndex(item => /^\d+\.?$/.test(normalize(item.innerText || item.textContent)));
        if (numberCellIndex === -1) continue;
        const titleCell = cells.slice(numberCellIndex + 1).find(item => {
          const text = normalize(item.innerText || item.textContent);
          return text && !item.querySelector('input, textarea, select, [contenteditable="true"]');
        });
        const title = normalize(titleCell?.innerText || titleCell?.textContent);
        if (title) {
          return {
            number: normalize(cells[numberCellIndex].innerText || cells[numberCellIndex].textContent).replace(/\.$/, ''),
            text: title
          };
        }
      }
      return null;
    };
    const tableAnswerTextFor = (el) => {
      const type = (el.type || '').toLowerCase();
      if (el.tagName !== 'TEXTAREA' && el.getAttribute('contenteditable') !== 'true' && type !== 'text') return '';
      const cell = el.closest('td, th');
      const previousCells = [];
      for (let current = cell?.previousElementSibling; current; current = current.previousElementSibling) {
        previousCells.unshift(current);
      }
      const previousLabel = previousCells.map(item => normalize(item.innerText || item.textContent)).filter(Boolean).pop();
      if (!previousLabel) return '';
      return /other:?$/i.test(previousLabel) ? 'Other text' : previousLabel;
    };
    const nearestHeading = (el) => {
      const fieldset = el.closest('fieldset');
      const legend = fieldset?.querySelector('legend');
      if (legend) return normalize(legend.innerText || legend.textContent);
      let current = el.parentElement;
      for (let depth = 0; current && depth < 6; depth++, current = current.parentElement) {
        const heading = current.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > [role="heading"], :scope > .section-title, :scope > .question-title');
        if (heading) return normalize(heading.innerText || heading.textContent);
      }
      const previousHeadings = [...document.querySelectorAll('h1, h2, h3, h4, [role="heading"], legend')].filter(heading => heading.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const previousHeading = previousHeadings.pop();
      return normalize(previousHeading?.innerText || previousHeading?.textContent || '');
    };
    const typeFor = (el) => el.tagName === 'TEXTAREA'
      ? 'textarea'
      : el.tagName === 'SELECT'
        ? 'select'
        : el.getAttribute('contenteditable') === 'true'
          ? 'contenteditable'
          : (el.type || 'text').toLowerCase();
    const controlSelector = [
      'textarea',
      'select',
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',
      '[contenteditable="true"]'
    ].join(',');
    const palette = {
      checkbox: '#db2777',
      radio: '#7c3aed',
      select: '#0891b2',
      textarea: '#2563eb',
      contenteditable: '#ea580c',
      text: '#059669'
    };
    const mode = options.mode === 'hover' ? 'hover' : 'labels';
    const prefix = slugify(options.pathPrefix || '');
    const controls = [...document.querySelectorAll(controlSelector)].filter(visible).map((el, index) => {
      const type = typeFor(el);
      const section = nearestHeading(el) || 'Unsectioned';
      const label = labelFor(el);
      const tableQuestion = tableQuestionFor(el);
      const questionText = tableQuestion?.text || '';
      const answerText = label || tableAnswerTextFor(el) || normalize(el.getAttribute('aria-label') || el.placeholder || el.value || '');
      const fallbackName = el.name || el.id || el.placeholder || label || `${type}_${index + 1}`;
      const basePath = [slugify(questionText || section), slugify(answerText || fallbackName)].filter(Boolean).join('.');
      return {
        el,
        index,
        type,
        color: palette[type] || palette.text,
        section,
        questionNumber: tableQuestion?.number || '',
        questionText,
        answerText,
        label,
        suggestedPath: [prefix, basePath || `${type}_${index + 1}`].filter(Boolean).join('.')
      };
    });
    const root = document.createElement('div');
    root.id = 'rose-discovery-visual-layer';
    root.setAttribute('data-mode', mode);
    root.style.cssText = 'position:absolute;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,system-ui,Arial,sans-serif;';
    document.body.appendChild(root);
    const state = { root, elements: [], listeners: [], reposition: () => {} };
    window[stateKey] = state;
    const makeLabel = (control, persistent) => {
      const badge = document.createElement('div');
      badge.className = 'rose-discovery-map-label';
      badge.textContent = `#${control.index} ${control.questionText ? `${control.questionText}: ` : ''}${control.suggestedPath || control.label || control.type}`;
      badge.style.cssText = [
        'position:absolute',
        'max-width:360px',
        'padding:4px 7px',
        `background:${control.color}`,
        'color:#fff',
        'font:700 12px/1.25 Inter,system-ui,Arial,sans-serif',
        'border-radius:6px',
        'box-shadow:0 8px 22px rgba(0,0,0,.22)',
        'white-space:normal',
        'overflow-wrap:anywhere',
        persistent ? 'opacity:.96' : 'opacity:1'
      ].join(';');
      root.appendChild(badge);
      return badge;
    };
    const positionLabel = (badge, control) => {
      const rect = control.el.getBoundingClientRect();
      badge.style.left = `${Math.max(6, rect.left + window.scrollX)}px`;
      badge.style.top = `${Math.max(6, rect.top + window.scrollY - badge.offsetHeight - 4)}px`;
    };
    const persistentLabels = [];
    controls.forEach((control) => {
      state.elements.push({
        el: control.el,
        outline: control.el.style.outline,
        boxShadow: control.el.style.boxShadow,
        scrollMarginTop: control.el.style.scrollMarginTop
      });
      control.el.style.outline = `3px solid ${control.color}`;
      control.el.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${control.color} 24%, transparent)`;
      control.el.style.scrollMarginTop = '64px';
      if (mode === 'labels') {
        const badge = makeLabel(control, true);
        persistentLabels.push({ badge, control });
      } else {
        let hoverBadge = null;
        const enter = () => {
          if (!hoverBadge) hoverBadge = makeLabel(control, false);
          hoverBadge.hidden = false;
          positionLabel(hoverBadge, control);
        };
        const leave = () => {
          if (hoverBadge) hoverBadge.hidden = true;
        };
        control.el.addEventListener('mouseenter', enter);
        control.el.addEventListener('mouseleave', leave);
        control.el.addEventListener('focus', enter);
        control.el.addEventListener('blur', leave);
        state.listeners.push({ el: control.el, enter, leave });
      }
    });
    state.reposition = () => {
      persistentLabels.forEach(({ badge, control }) => positionLabel(badge, control));
    };
    window.addEventListener('scroll', state.reposition, true);
    window.addEventListener('resize', state.reposition);
    state.reposition();
    return {
      event: 'visual_mapping',
      mode,
      controls: controls.length,
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title
    };
  } catch (err) {
    cleanup();
    return { error: err.message };
  }
}
function pageFill(config, merged, dryRun) {
  const isBlankLocal = (value) => value === undefined || value === null || value === '';
  const getPath = (obj, path) => path.split('.').reduce((cur, part) => cur == null ? undefined : cur[part], obj);
  const setPathLocal = (obj, path, value) => {
    const parts = path.split('.').map(part => part.trim()).filter(Boolean);
    if (!parts.length) return;
    let cur = obj;
    parts.slice(0, -1).forEach(part => { cur[part] = cur[part] || {}; cur = cur[part]; });
    cur[parts[parts.length - 1]] = value;
  };
  const coerce = (value) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return undefined;
    return value;
  };
  const hasUsefulValue = (value) => !isBlankLocal(coerce(value)) && String(value).trim().toLowerCase() !== 'n/a';
  const hasAnyUsefulPath = (obj, paths) => paths.some(path => hasUsefulValue(getPath(obj, path)));
  const firstUsefulPathValue = (obj, paths) => {
    for (const path of paths) {
      const value = coerce(getPath(obj, path));
      if (hasUsefulValue(value)) return value;
    }
    return undefined;
  };
  const hasChoice = (obj, parentPath, choice) => getChoiceValue(obj, `${parentPath}.${choice}`) === true;
  const choiceIsNo = (obj, parentPath) => hasChoice(obj, parentPath, 'no');
  const choiceIsYes = (obj, parentPath) => hasChoice(obj, parentPath, 'yes');
  const textIncludesAny = (value, terms) => {
    const text = String(value ?? '').toLowerCase();
    return terms.some(term => text.includes(term));
  };
  const normalizedTextValue = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const lowerTextValue = (value) => normalizedTextValue(value).toLowerCase();
  const isNotProvidedText = (value) => {
    const text = lowerTextValue(value);
    return [
      'information not provided',
      'not provided',
      'not stated',
      'not discussed',
      'unknown',
      'none stated',
      'none reported'
    ].includes(text);
  };
  const isRuleBlank = (value) => {
    const coerced = coerce(value);
    if (isBlankLocal(coerced)) return true;
    const text = lowerTextValue(coerced);
    return ['n/a', 'na', 'not applicable'].includes(text) || isNotProvidedText(coerced);
  };
  const hasSpecificValue = (value) => !isRuleBlank(value);
  const firstSpecificPathValue = (obj, paths) => {
    for (const path of paths) {
      const value = coerce(getPath(obj, path));
      if (hasSpecificValue(value)) return value;
    }
    return undefined;
  };
  const sentenceCaseName = (value) => String(value || '').trim().toLowerCase().replace(/(^|[-' ])([a-z])/g, (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  const firstNameFromText = (value) => {
    const text = normalizedTextValue(value).replace(/\([^)]*\)/g, '').trim();
    if (!text) return '';
    const afterComma = text.includes(',') ? text.split(',').slice(1).join(',').trim() : text;
    const token = (afterComma || text).split(/\s+/).find(part => /^[A-Za-z][A-Za-z'-]*$/.test(part));
    return token ? sentenceCaseName(token) : '';
  };
  const findClientFirstName = (data) => {
    const pathValue = firstSpecificPathValue(data, [
      'client.first_name',
      'client.firstName',
      'client_first_name',
      'first_name',
      'demographics.first_name',
      'client.name',
      'client.full_name',
      'clientName'
    ]);
    const fromData = firstNameFromText(pathValue);
    if (fromData) return fromData;
    const domSelectors = [
      '.clientsrow.selected .cd-clientname',
      '.clientName',
      '[data-client-name]',
      '#clientName',
      '.client-name'
    ];
    for (const selector of domSelectors) {
      const text = document.querySelector(selector)?.textContent || document.querySelector(selector)?.getAttribute('data-client-name') || '';
      const parsed = firstNameFromText(text);
      if (parsed) return parsed;
    }
    return '';
  };
  const clientFirstNameFromData = findClientFirstName(merged || {});
  const clientSubject = () => clientFirstNameFromData || 'Client';
  const asamSafetyWhySubject = (value) => {
    if (clientFirstNameFromData) return clientFirstNameFromData;
    const text = normalizedTextValue(value).replace(/^(the client|client|the patient|patient)\b/i, '').trim();
    const leadingName = text.match(/^([A-Z][A-Za-z'-]*)\b/);
    const blockedSubjects = new Set(['Additional', 'No', 'Safety', 'There', 'While', 'Although', 'Because']);
    return leadingName && !blockedSubjects.has(leadingName[1]) ? leadingName[1] : clientSubject();
  };
  const formatAsamSafetyWhy = (value) => {
    const needed = normalizeYesNoText(
      firstUsefulPathValue(merged, [
        'case_management.safety_planning.additional_safety_planning_needed',
        'case_management.safetyPlanning.additional_safety_planning_needed',
        'case_management.safety_planning.is_additional_safety_planning_needed',
        'case_management.safetyPlanning.is_additional_safety_planning_needed',
        'case_management.safety_planning.needed',
        'case_management.safetyPlanning.needed'
      ])
    );
    if (needed === 'No' && hasUsefulValue(value)) return `${asamSafetyWhySubject(value)} denies being a suicide risk`;
    return value;
  };
  const withPeriod = (value) => {
    const text = normalizedTextValue(value);
    if (!text) return '';
    return /[.!?]$/.test(text) ? text : `${text}.`;
  };
  const setChoiceLocal = (obj, parentPath, choice) => {
    const otherChoice = choice === 'yes' ? 'no' : choice === 'no' ? 'yes' : '';
    const current = getPath(obj, parentPath);
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      setPathLocal(obj, `${parentPath}.${choice}`, true);
      if (otherChoice) setPathLocal(obj, `${parentPath}.${otherChoice}`, false);
    } else {
      setPathLocal(obj, parentPath, choice);
    }
  };
  const clearYesNoChoiceLocal = (obj, parentPath) => {
    const current = getPath(obj, parentPath);
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      setPathLocal(obj, `${parentPath}.yes`, false);
      setPathLocal(obj, `${parentPath}.no`, false);
    }
  };
  const explicitYesNoChoice = (obj, parentPath) => choiceIsYes(obj, parentPath) || choiceIsNo(obj, parentPath);
  const cleanSubstanceName = (value) => normalizedTextValue(value)
    .replace(/^substance\s*:?\s*/i, '')
    .replace(/[:,-]+\s*$/g, '')
    .trim();
  const cleanSubstanceAge = (value) => normalizedTextValue(value)
    .replace(/^(?:age of first use|age)\s*:?\s*/i, '')
    .trim();
  const parseSubstanceAgeValue = (value) => {
    const text = normalizedTextValue(value);
    if (!text) return { substance: '', age: '' };
    const labeledSubstanceAndAge = text.match(/^substance\s*:?\s*(.*?)\s+(?:age of first use|age)\s*:?\s*(.+)$/i);
    if (labeledSubstanceAndAge) {
      return { substance: cleanSubstanceName(labeledSubstanceAndAge[1]), age: cleanSubstanceAge(labeledSubstanceAndAge[2]) };
    }
    const ageLabelOnly = text.match(/^(?:age of first use|age)\s*:?\s*(.+)$/i);
    if (ageLabelOnly) return { substance: '', age: cleanSubstanceAge(ageLabelOnly[1]) };
    const substanceAndAgeLabel = text.match(/^(.+?)\s+(?:age of first use|age)\s*:?\s*(.+)$/i);
    if (substanceAndAgeLabel) {
      return { substance: cleanSubstanceName(substanceAndAgeLabel[1]), age: cleanSubstanceAge(substanceAndAgeLabel[2]) };
    }
    const colonMatch = text.match(/^([^:\n]+):\s*(.+)$/i);
    if (colonMatch) {
      const rawLabelText = normalizedTextValue(colonMatch[1]);
      const rawLabel = cleanSubstanceName(rawLabelText);
      const rawDetail = cleanSubstanceAge(colonMatch[2]);
      if (/^age of first use$/i.test(rawLabelText) || /^age$/i.test(rawLabelText)) return { substance: '', age: rawDetail };
      if (/^substance$/i.test(rawLabelText)) return { substance: cleanSubstanceName(rawDetail), age: '' };
      return { substance: rawLabel, age: rawDetail };
    }
    const inlineAgeMatch = text.match(/^(.+?)\s+age\s+(.+)$/i);
    if (inlineAgeMatch) {
      return { substance: cleanSubstanceName(inlineAgeMatch[1]), age: cleanSubstanceAge(inlineAgeMatch[2]) };
    }
    return { substance: '', age: cleanSubstanceAge(text) };
  };
  const stripReportedNarrativePrefix = (value) => normalizedTextValue(value)
    .replace(/^(?:the\s+client|client|i|he|she|they|[A-Z][A-Za-z'-]*)\s+(?:reports?|reported|states?|stated|endorses?|endorsed|says?|said)\s+(?:that\s+)?/i, '')
    .replace(/^(?:the\s+client|client|i|he|she|they)\s+(?:currently\s+)?/i, '')
    .trim();
  const tobaccoMentionsVaping = (value) => /\b(vap(?:e|es|ed|ing)?|e[-\s]?cigs?|e[-\s]?cigarettes?|electronic cigarettes?|juul)\b/i.test(String(value || ''));
  const tobaccoMentionsSpecificNonVapeRoute = (value) => /\b(cigarettes?|cigars?|pipe|hookah|chew(?:ing)?(?:\s+tobacco)?|chewing tobacco|dip|snuff)\b/i.test(String(value || ''));
  const tobaccoMentionsGenericCurrentUse = (value) => {
    const text = lowerTextValue(value);
    return ['yes', 'y'].includes(text) ||
      /^yes\b/.test(text) ||
      /\b(current(?:ly)?|active(?:ly)?)\b.*\b(smok(?:e|es|ing|er)?|tobacco|nicotine|vap(?:e|es|ed|ing)?)\b/.test(text) ||
      /\b(smok(?:e|es|ing|er)?|tobacco|nicotine|vap(?:e|es|ed|ing)?)\b/.test(text);
  };
  const tobaccoDeniesCurrentUse = (value) => {
    const text = lowerTextValue(value);
    return /\b(no|none|never|denies?|denied|not)\b.{0,40}\b(tobacco|nicotine|smok(?:e|es|ing|er)?|cigarettes?|cigars?|vap(?:e|es|ed|ing)?|e[-\s]?cig|chew|dip|snuff)\b/.test(text) ||
      /\b(?:does\s+not|doesn't|do\s+not|don't|not\s+currently)\s+(?:use\s+)?(?:tobacco|nicotine|smok(?:e|es|ing)?|cigarettes?|cigars?|vap(?:e|es|ed|ing)?|e[-\s]?cig|chew|dip|snuff)\b/.test(text) ||
      /\b(former|past|previous|quit|stopped|abstinent)\b.{0,40}\b(tobacco|nicotine|smok(?:e|es|ing|er)?|cigarettes?|cigars?|vap(?:e|es|ed|ing)?|e[-\s]?cig|chew|dip|snuff)\b/.test(text);
  };
  const tobaccoNicotineFreeVaping = (value) => /\b(nicotine[-\s]?free|without nicotine|no nicotine|non[-\s]?nicotine|zero nicotine|0\s*mg(?:\s+of)?\s+nicotine|does\s+not\s+contain\s+nicotine|doesn't\s+contain\s+nicotine|contains?\s+no\s+nicotine)\b/i.test(String(value || ''));
  const tobaccoFrequencyMissing = (value) => {
    const text = lowerTextValue(value);
    if (!text) return true;
    if (isRuleBlank(text)) return true;
    if (['yes', 'y', 'smoke', 'smokes', 'smoking', 'smoker', 'tobacco', 'nicotine', 'tobacco use', 'nicotine use', 'current tobacco use', 'current nicotine use'].includes(text.replace(/[.]+$/g, ''))) return true;
    if (/\b(frequency|amount|specific amount and frequency)\b.*\b(not provided|not specified|unknown)\b/.test(text)) return true;
    return !tobaccoFrequencyDetail(value);
  };
  const tobaccoFrequencyDetail = (value) => stripReportedNarrativePrefix(value)
    .replace(/\b(nicotine[-\s]?free|without nicotine|no nicotine|non[-\s]?nicotine|zero nicotine|0\s*mg(?:\s+of)?\s+nicotine|does\s+not\s+contain\s+nicotine|doesn't\s+contain\s+nicotine|contains?\s+no\s+nicotine)(?:\s+\w+)?\b/ig, ' ')
    .replace(/\b(current(?:ly)?|active(?:ly)?|use|uses|using|tobacco|nicotine|smoke|smokes|smoking|smoker|vape|vapes|vaping|vaped|e[-\s]?cigs?|e[-\s]?cigarettes?|electronic cigarettes?|juul|cigarettes?|cigars?|pipe|hookah|chew(?:ing)?(?:\s+tobacco)?|dip|snuff|i|he|she|they|client|the client|it|does|do|not|but)\b/ig, ' ')
    .replace(/^yes\b/ig, ' ')
    .replace(/\b(and|or|with|contains?)\b/ig, ' ')
    .replace(/[.;:,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tobaccoCurrentUseReported = (data, combinedText) => {
    if (truthySelectionFlag(getPath(data, 'tobacco.no_history'))) return false;
    const textReportsCurrentUse = tobaccoMentionsGenericCurrentUse(combinedText) &&
      (!tobaccoDeniesCurrentUse(combinedText) || (tobaccoMentionsVaping(combinedText) && tobaccoNicotineFreeVaping(combinedText)));
    if (textReportsCurrentUse) return true;
    if (choiceIsYes(data, 'tobacco.uses_tobacco_or_vapes')) return true;
    return false;
  };
  const tobaccoNarrative = (value, combinedText, forceAmbiguousUse = false) => {
    const sourceText = hasSpecificValue(value) ? normalizedTextValue(value) : normalizedTextValue(combinedText);
    const detail = stripReportedNarrativePrefix(sourceText);
    const hasVaping = tobaccoMentionsVaping(detail);
    const hasSpecificNonVape = tobaccoMentionsSpecificNonVapeRoute(detail);
    const genericSmokingOnly = /\bsmok(?:e|es|ing|er)?\b/i.test(detail) && !hasSpecificNonVape && !hasVaping;
    const ambiguousCurrentUse = !hasSpecificNonVape && (!hasVaping || /\btobacco\b/i.test(detail)) && tobaccoMentionsGenericCurrentUse(detail);
    const normalizeAction = (text) => text
      .replace(/^i\s+/i, '')
      .replace(/^currently\s+/i, '')
      .replace(/^smokes?\b/i, 'smoking')
      .replace(/^vapes?\b/i, 'vaping')
      .replace(/^uses?\s+(?:a\s+)?vape\b/i, 'vaping')
      .trim();
    if (forceAmbiguousUse || genericSmokingOnly || ambiguousCurrentUse) {
      const frequency = tobaccoFrequencyMissing(detail) ? '' : tobaccoFrequencyDetail(detail);
      return `${clientSubject()} reports smoking and vaping${frequency ? ` ${frequency}` : ''}.`;
    }
    const normalizedDetail = normalizeAction(detail);
    if (hasVaping && !hasSpecificNonVape) {
      const frequency = tobaccoFrequencyDetail(normalizedDetail);
      return `${clientSubject()} reports vaping${frequency ? ` ${frequency}` : ''}.`;
    }
    if (hasSpecificNonVape && tobaccoFrequencyMissing(detail)) {
      return `${clientSubject()} reports ${withPeriod(normalizedDetail || 'tobacco use')}`;
    }
    return `${clientSubject()} reports ${withPeriod(normalizedDetail || 'smoking and vaping')}`;
  };
  const currentProviderDetails = (data) => firstSpecificPathValue(data, [
    'mental_health_treatment.mental_health_professionals_contact',
    'mental_health_treatment.provider_contact',
    'mental_health_treatment.current_provider_contact',
    'mental_health_treatment.psychiatrist_contact',
    'mental_health_treatment.therapist_contact'
  ]);
  const hasCurrentProviderDetails = (data) => hasSpecificValue(currentProviderDetails(data));
  const providerDetailsMentionPsychiatrist = (value) => /\b(psychiatrist|psychiatric\s+(?:provider|prescriber|doctor)|psych\s*(?:provider|doctor|prescriber|np|pa)|medication\s+management|med\s+management)\b/i.test(String(value || ''));
  const providerDetailsMentionTherapist = (value) => /\b(therapist|therapy|counsel(?:or|ing)|outpatient\s+therapist|intensive\s+outpatient|iop|clinician)\b/i.test(String(value || ''));
  const normalizeMentalHealthProviderDefaults = (data) => {
    const providerDetails = currentProviderDetails(data);
    if (providerDetailsMentionPsychiatrist(providerDetails) && !explicitYesNoChoice(data, 'mental_health_treatment.currently_working_with_psychiatrist')) {
      setChoiceLocal(data, 'mental_health_treatment.currently_working_with_psychiatrist', 'yes');
    }
    if (providerDetailsMentionTherapist(providerDetails) && !explicitYesNoChoice(data, 'mental_health_treatment.currently_working_with_therapist')) {
      setChoiceLocal(data, 'mental_health_treatment.currently_working_with_therapist', 'yes');
    }
    [
      'mental_health_treatment.currently_working_with_psychiatrist',
      'mental_health_treatment.currently_working_with_therapist'
    ].forEach(path => {
      if (!explicitYesNoChoice(data, path)) setChoiceLocal(data, path, 'no');
    });
    if (choiceIsNo(data, 'mental_health_treatment.currently_working_with_psychiatrist') &&
      choiceIsNo(data, 'mental_health_treatment.currently_working_with_therapist') &&
      !hasCurrentProviderDetails(data)) {
      setPathLocal(data, 'mental_health_treatment.mental_health_professionals_contact', 'n/a');
    }
  };
  const attemptCountIsExactlyOne = (value) => {
    const text = lowerTextValue(value);
    const hasRangeOrPluralCue = /\b(or more|or two|to|and|plus|multiple|several|many|unknown|unclear)\b/.test(text);
    const numbers = [...text.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(match => Number(match[0]));
    if (numbers.length) return numbers[0] === 1 && !hasRangeOrPluralCue;
    if (/^1(?:\.0)?$/.test(text)) return true;
    if (/^(?:one|single|a single)$/.test(text)) return true;
    if (/\b(?:one|single|a single)\b.{0,40}\b(?:past\s+)?(?:suicide\s+)?attempt\b/.test(text) && !hasRangeOrPluralCue) return true;
    if (/\b1\b.{0,40}\b(?:past\s+)?(?:suicide\s+)?attempt\b/.test(text) && !hasRangeOrPluralCue) return true;
    return false;
  };
  const nonSpecificAttemptFeelings = (value) => {
    const text = lowerTextValue(value);
    return isRuleBlank(value) ||
      /\b(not provided|not reported|not specified|not discussed|unspecified|unknown|no specific|information unavailable)\b/.test(text);
  };
  const suicideAttemptRegretDefault = (data) => (
    attemptCountIsExactlyOne(getPath(data, 'symptoms_suicide_self_harm.attempt_count'))
      ? `${clientSubject()} reports regretting their past suicide attempt.`
      : `${clientSubject()} reports regretting past suicide attempts.`
  );
  const normalizeSuicideAttemptFeelings = (data) => {
    const feelingsPath = 'symptoms_suicide_self_harm.feelings_about_past_attempts';
    if (choiceIsNo(data, 'symptoms_suicide_self_harm.history_suicide_attempts')) {
      setPathLocal(data, feelingsPath, 'n/a');
      return;
    }
    if (choiceIsYes(data, 'symptoms_suicide_self_harm.history_suicide_attempts') && nonSpecificAttemptFeelings(getPath(data, feelingsPath))) {
      setPathLocal(data, feelingsPath, suicideAttemptRegretDefault(data));
    }
  };
  const noMentalHealthDiagnosisHistory = (data) => {
    const noHistoryFlag = getPath(data, 'mental_health.no_history');
    if (truthySelectionFlag(noHistoryFlag)) return true;
    const diagnosis = getPath(data, 'mental_health.diagnosis_history');
    const diagnosisText = lowerTextValue(diagnosis);
    const deniesDiagnosis = /(^|\b)(no|none|denies|denied|never)\b.*\bdiagnos/.test(diagnosisText) ||
      /no history of (a )?mental health diagnos/.test(diagnosisText) ||
      ['no', 'none'].includes(diagnosisText);
    const hasDiagnosisDetails = hasSpecificValue(getPath(data, 'mental_health.age_diagnosed')) ||
      hasSpecificValue(getPath(data, 'mental_health.diagnosed_by')) ||
      explicitYesNoChoice(data, 'mental_health.agrees_with_diagnosis') ||
      hasSpecificValue(getPath(data, 'mental_health.using_substances_at_diagnosis')) ||
      hasSpecificValue(getPath(data, 'mental_health.substance_use_impacted_diagnosis'));
    return (isRuleBlank(diagnosis) || deniesDiagnosis) && !hasDiagnosisDetails;
  };
  const slugToken = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const canonicalMseItemKey = (value) => {
    const key = slugToken(value);
    if (key === 'judgement') return 'judgment';
    return key;
  };
  const itemKeyAliases = (itemKey) => {
    const canonical = canonicalMseItemKey(itemKey);
    return [...new Set([canonical, itemKey, canonical === 'judgment' ? 'judgement' : ''].filter(Boolean))];
  };
  const pathSuffixForSelection = (selection) => slugToken(selection);
  const dataShapeWarnings = [];
  const hasUsefulMedicationSet = (obj, basePath) => [1, 2, 3].some(i => hasAnyUsefulPath(obj, [
    `${basePath}.medication_${i}.name`,
    `${basePath}.medication_${i}.dosage_frequency`,
    `${basePath}.medication_${i}.side_effects`
  ]));
  const mseNormalSelectionsByItem = {
    build_stature: ['Within Normal Limits'],
    posture: ['Within Normal Limits'],
    activity: ['Within Normal Limits'],
    thought_process: ['Logical'],
    perception: ['Within normal limits'],
    hallucinations: ['Denied', 'None evidenced'],
    thought_content: ['Within normal limits'],
    delusions: ['None reported'],
    cognition: ['Within normal limits'],
    insight: ['Within normal limits'],
    judgment: ['Within normal limits'],
    judgement: ['Within normal limits']
  };
  const normalizeMseSelection = (value) => String(value || '').trim().toLowerCase();
  const normalSelectionsForMseItem = (itemKey) => (
    mseNormalSelectionsByItem[canonicalMseItemKey(itemKey)] ||
    mseNormalSelectionsByItem[itemKey] ||
    []
  );
  const truthySelectionFlag = (value) => (
    value === true ||
    ['true', 'yes', 'checked', '1', 'selected', 'x'].includes(String(value ?? '').trim().toLowerCase())
  );
  const selectionListFromMseItem = (item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    if (Array.isArray(item.selections)) return item.selections.map(selection => String(selection || '').trim()).filter(Boolean);
    if (item.selections && typeof item.selections === 'object') {
      return Object.entries(item.selections)
        .filter(([, value]) => truthySelectionFlag(value))
        .map(([selection]) => String(selection || '').trim())
        .filter(Boolean);
    }
    if (typeof item.selections === 'string') return [item.selections.trim()].filter(Boolean);
    return [];
  };
  const mseItemFromData = (data, itemKey) => {
    const items = data?.mse?.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) return null;
    for (const key of itemKeyAliases(itemKey)) {
      if (items[key] && typeof items[key] === 'object' && !Array.isArray(items[key])) return items[key];
    }
    return null;
  };
  const mseItemHasAbnormalOrOther = (data, itemKey) => {
    const item = mseItemFromData(data, itemKey);
    if (!item) return false;
    const normalSet = new Set(normalSelectionsForMseItem(itemKey).map(normalizeMseSelection));
    const selections = selectionListFromMseItem(item).map(normalizeMseSelection).filter(Boolean);
    const hasOtherText = Boolean(String(item.other_text || item.narrative || '').trim());
    const hasOtherSelection = selections.includes('other');
    const hasAbnormalSelection = selections.some(selection => !normalSet.has(selection));
    return hasOtherText || hasOtherSelection || hasAbnormalSelection;
  };
  const mseSelectionPathInfo = (path) => {
    const text = String(path || '');
    const prefixedSelection = text.match(/^mse\.items\.([^.]+)\.selections\.(.+)$/);
    if (prefixedSelection) return { itemKey: canonicalMseItemKey(prefixedSelection[1]), selection: prefixedSelection[2] };
    const bareSelection = text.match(/^([^.]+)\.selections\.(.+)$/);
    if (bareSelection) return { itemKey: canonicalMseItemKey(bareSelection[1]), selection: bareSelection[2] };
    const prefixedChoice = text.match(/^mse\.items\.([^.]+)\.([^.]+)$/);
    if (prefixedChoice && !['other_text', 'narrative'].includes(prefixedChoice[2])) {
      return { itemKey: canonicalMseItemKey(prefixedChoice[1]), selection: prefixedChoice[2] };
    }
    const bareChoice = text.match(/^([^.]+)\.([^.]+)$/);
    if (bareChoice && !['other_text', 'narrative'].includes(bareChoice[2])) {
      return { itemKey: canonicalMseItemKey(bareChoice[1]), selection: bareChoice[2] };
    }
    return null;
  };
  const isMseNormalSelectionPath = (path) => {
    const info = mseSelectionPathInfo(path);
    if (!info) return false;
    const normalSlugs = new Set(normalSelectionsForMseItem(info.itemKey).map(selection => slugToken(selection)));
    return normalSlugs.has(slugToken(info.selection));
  };
  const normalizeMseSelectionConflicts = (data) => {
    const items = data?.mse?.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) return;
    for (const [itemKey, normalSelections] of Object.entries(mseNormalSelectionsByItem)) {
      const item = mseItemFromData(data, itemKey);
      if (!item) continue;
      const normalSet = new Set(normalSelections.map(normalizeMseSelection));
      const selections = selectionListFromMseItem(item);
      const hasAbnormalSelection = selections.some(selection => !normalSet.has(normalizeMseSelection(selection)));
      if (!hasAbnormalSelection) continue;
      if (Array.isArray(item.selections)) {
        const before = item.selections.slice();
        item.selections = item.selections.filter(selection => !normalSet.has(normalizeMseSelection(selection)));
        if (item.selections.length !== before.length) {
          dataShapeWarnings.push(`MSE ${itemKey} included normal/default selection with abnormal or Other selection; removed ${before.filter(selection => normalSet.has(normalizeMseSelection(selection))).join(', ')} before filling.`);
        }
      } else if (item.selections && typeof item.selections === 'object') {
        const removed = [];
        for (const [selection, selected] of Object.entries(item.selections)) {
          if (truthySelectionFlag(selected) && normalSet.has(normalizeMseSelection(selection))) {
            item.selections[selection] = false;
            removed.push(selection);
          }
        }
        if (removed.length) {
          dataShapeWarnings.push(`MSE ${itemKey} included normal/default selection with abnormal or Other selection; removed ${removed.join(', ')} before filling.`);
        }
      }
    }
  };
  const normalizeMseOtherTextSelections = (data, sourceLabel) => {
    const items = data?.mse?.items;
    if (!items || typeof items !== 'object' || Array.isArray(items)) return;
    for (const [itemKey, item] of Object.entries(items)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const otherText = String(item.other_text || item.narrative || '').trim();
      if (!otherText) continue;
      if (Array.isArray(item.selections)) {
        if (!item.selections.some(selection => normalizeMseSelection(selection) === 'other')) {
          item.selections.push('Other');
          dataShapeWarnings.push(`${sourceLabel} ${itemKey} included other_text without Other selected; selected Other before filling.`);
        }
      } else if (item.selections && typeof item.selections === 'object') {
        if (item.selections.Other !== true) {
          item.selections.Other = true;
          dataShapeWarnings.push(`${sourceLabel} ${itemKey} included other_text without Other selected; selected Other before filling.`);
        }
      } else {
        item.selections = ['Other'];
        dataShapeWarnings.push(`${sourceLabel} ${itemKey} included other_text without Other selected; selected Other before filling.`);
      }
    }
  };
  const normalizeMergedData = (data) => {
    const normalized = JSON.parse(JSON.stringify(data || {}));
    const hasTopLevelMedications = hasUsefulMedicationSet(normalized, 'medications');
    const hasNestedMedicalMedications = hasUsefulMedicationSet(normalized, 'medical.medications');
    if (hasNestedMedicalMedications && !hasTopLevelMedications) {
      normalized.medications = normalized.medical.medications;
      dataShapeWarnings.push('Prompt 3 returned medications under medical.medications; normalized to medications.* before filling.');
    } else if (hasNestedMedicalMedications && hasTopLevelMedications) {
      dataShapeWarnings.push('Prompt 3 returned both medications.* and medical.medications; using top-level medications.* values.');
    }
    const thirdSubstanceValue = getPath(normalized, 'substance_use.substance_3.substance');
    const thirdSubstanceText = normalizedTextValue(thirdSubstanceValue);
    if (hasSpecificValue(thirdSubstanceValue)) {
      const thirdSubstanceCombined = parseSubstanceAgeValue(thirdSubstanceValue);
      const thirdSubstanceLabel = thirdSubstanceText.match(/^substance\s*:?\s*(.+)$/i);
      if (thirdSubstanceCombined.substance && thirdSubstanceCombined.age) {
        setPathLocal(normalized, 'substance_use.substance_3.substance', thirdSubstanceCombined.substance);
        if (!hasSpecificValue(getPath(normalized, 'substance_use.substance_3.age_first_use'))) {
          setPathLocal(normalized, 'substance_use.substance_3.age_first_use', thirdSubstanceCombined.age);
        }
        dataShapeWarnings.push('Substance 3 substance field included an age value; split it into separate Substance 3 substance and age fields before filling.');
      } else if (thirdSubstanceLabel && thirdSubstanceLabel[1].trim() !== thirdSubstanceText) {
        setPathLocal(normalized, 'substance_use.substance_3.substance', thirdSubstanceLabel[1].trim());
      }
    }
    const thirdSubstanceAge = parseSubstanceAgeValue(getPath(normalized, 'substance_use.substance_3.age_first_use'));
    if (!hasSpecificValue(getPath(normalized, 'substance_use.substance_3.substance')) && thirdSubstanceAge.substance) {
      setPathLocal(normalized, 'substance_use.substance_3.substance', thirdSubstanceAge.substance);
      dataShapeWarnings.push('Substance 3 age_first_use included a substance name; normalized it to the separate Substance 3 substance field before filling.');
    }
    if (thirdSubstanceAge.age && thirdSubstanceAge.age !== normalizedTextValue(getPath(normalized, 'substance_use.substance_3.age_first_use'))) {
      setPathLocal(normalized, 'substance_use.substance_3.age_first_use', thirdSubstanceAge.age);
    }
    if (choiceIsYes(normalized, 'medical.has_primary_care')) {
      ['primary_care_clinic_or_doctor', 'primary_care_doctor_name'].forEach(field => {
        const path = `medical.${field}`;
        if (isRuleBlank(getPath(normalized, path))) setPathLocal(normalized, path, 'Unknown by client');
      });
    } else if (choiceIsNo(normalized, 'medical.has_primary_care')) {
      setPathLocal(normalized, 'medical.primary_care_clinic_or_doctor', 'n/a');
      setPathLocal(normalized, 'medical.primary_care_doctor_name', 'n/a');
    }
    normalizeMentalHealthProviderDefaults(normalized);
    if (noMentalHealthDiagnosisHistory(normalized)) {
      setPathLocal(normalized, 'mental_health.no_history', true);
      setPathLocal(normalized, 'mental_health.diagnosis_history', `${clientSubject()} reports no history of mental health diagnosis.`);
      setPathLocal(normalized, 'mental_health.age_diagnosed', 'n/a');
      setPathLocal(normalized, 'mental_health.diagnosed_by', 'n/a');
      clearYesNoChoiceLocal(normalized, 'mental_health.agrees_with_diagnosis');
      setPathLocal(normalized, 'mental_health.using_substances_at_diagnosis', 'n/a');
      setPathLocal(normalized, 'mental_health.substance_use_impacted_diagnosis', 'n/a');
    }
    for (let i = 1; i <= 3; i++) {
      const base = `medications.medication_${i}`;
      const hasMedication = hasSpecificValue(getPath(normalized, `${base}.name`)) ||
        hasSpecificValue(getPath(normalized, `${base}.dosage_frequency`));
      if (hasMedication && !explicitYesNoChoice(normalized, `${base}.mixed_with_alcohol_or_drugs`)) {
        setChoiceLocal(normalized, `${base}.mixed_with_alcohol_or_drugs`, 'no');
      }
    }
    if (choiceIsYes(normalized, 'sexual_history.tested_std_hepatitis_hiv')) {
      setChoiceLocal(normalized, 'sexual_history.wants_sexual_health_resources_if_no', 'no');
    }
    const combinedAttemptPath = 'symptoms_suicide_self_harm.attempt_dates_and_methods';
    if (!hasSpecificValue(getPath(normalized, combinedAttemptPath))) {
      const legacyAttemptDetails = [
        getPath(normalized, 'symptoms_suicide_self_harm.attempt_dates'),
        getPath(normalized, 'symptoms_suicide_self_harm.attempt_methods')
      ].filter(hasSpecificValue).map(normalizedTextValue);
      if (legacyAttemptDetails.length) {
        setPathLocal(normalized, combinedAttemptPath, [...new Set(legacyAttemptDetails)].join(' '));
        dataShapeWarnings.push('Combined legacy suicide-attempt date and method fields for the single ReliaTrax textbox.');
      }
    }
    normalizeSuicideAttemptFeelings(normalized);
    if (choiceIsNo(normalized, 'medical.dental_problems')) {
      setPathLocal(normalized, 'medical.dentist_next_plan', `${clientSubject()} reports no dental problems or plans to see a dentist at this time.`);
    } else if (choiceIsYes(normalized, 'medical.dental_problems')) {
      const currentPlan = getPath(normalized, 'medical.dentist_next_plan');
      const planText = lowerTextValue(currentPlan);
      const hasAppointmentPlan = hasSpecificValue(currentPlan) &&
        /\b(appointment|scheduled|set up|next|tomorrow|today|week|month|on \d|plans? to see|will see)\b/.test(planText) &&
        !/\b(no|not|without)\b.*\b(appointment|scheduled|set up)\b/.test(planText);
      if (!hasAppointmentPlan) {
        const concern = firstSpecificPathValue(normalized, [
          'medical.dental_concern',
          'medical.dental_concerns',
          'medical.dental_problem_details',
          'medical.dental_issue',
          'medical.dental_issues'
        ]) || (hasSpecificValue(currentPlan) ? currentPlan : 'dental concerns');
        setPathLocal(normalized, 'medical.dentist_next_plan', `${clientSubject()} reports ${normalizedTextValue(concern)} and is not set up to see a dentist at this time.`);
      }
    }
    const religion = getPath(normalized, 'spiritual_cultural.religion_affiliation');
    if (isRuleBlank(religion) || ['no', 'none', 'no affiliation', 'none reported', 'not affiliated'].includes(lowerTextValue(religion))) {
      setPathLocal(normalized, 'spiritual_cultural.religion_affiliation', 'No');
      setPathLocal(normalized, 'spiritual_cultural.active_in_religion', 'n/a');
    }
    const tobaccoAmount = getPath(normalized, 'tobacco.amount_and_frequency');
    const tobaccoText = [
      tobaccoAmount,
      getPath(normalized, 'tobacco.type'),
      getPath(normalized, 'tobacco.tobacco_type'),
      getPath(normalized, 'tobacco.route'),
      getPath(normalized, 'tobacco.product')
    ].filter(Boolean).join(' ');
    const tobaccoCurrentUse = tobaccoCurrentUseReported(normalized, tobaccoText);
    if (tobaccoCurrentUse) {
      const tobaccoHasVaping = tobaccoMentionsVaping(tobaccoText);
      const tobaccoHasSpecificNonVape = tobaccoMentionsSpecificNonVapeRoute(tobaccoText);
      const tobaccoImpliesVaping = tobaccoHasVaping || !tobaccoHasSpecificNonVape;
      setChoiceLocal(normalized, 'tobacco.uses_tobacco_or_vapes', 'yes');
      if (tobaccoImpliesVaping) {
        setChoiceLocal(normalized, 'tobacco.vape_contains_nicotine', tobaccoNicotineFreeVaping(tobaccoText) ? 'no' : 'yes');
      }
      setPathLocal(normalized, 'tobacco.amount_and_frequency', tobaccoNarrative(tobaccoAmount, tobaccoText, !tobaccoHasVaping && !tobaccoHasSpecificNonVape));
    }
    normalizeMseOtherTextSelections(normalized, 'MSE response');
    normalizeMseSelectionConflicts(normalized);
    return normalized;
  };
  const choiceFromPath = (path) => {
    const dotMatch = String(path || '').match(/^(.*)\.(yes|no)$/);
    if (dotMatch) return { parentPath: dotMatch[1], choice: dotMatch[2] };
    const flatMatch = String(path || '').match(/^(.*)_(yes|no)$/);
    if (flatMatch) return { parentPath: flatMatch[1], choice: flatMatch[2] };
    const genericDotMatch = String(path || '').match(/^(.*)\.([^.]+)$/);
    if (genericDotMatch) return { parentPath: genericDotMatch[1], choice: genericDotMatch[2] };
    const genericFlatMatch = String(path || '').match(/^(.*)_([^_]+)$/);
    if (genericFlatMatch) return { parentPath: genericFlatMatch[1], choice: genericFlatMatch[2] };
    return null;
  };
  const normalizeChoiceToken = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const valueMatchesChoice = (value, choice) => {
    const normalizedChoice = normalizeChoiceToken(choice);
    if (Array.isArray(value)) return value.some(item => normalizeChoiceToken(item) === normalizedChoice);
    if (typeof value === 'boolean' && ['yes', 'no'].includes(normalizedChoice)) return normalizedChoice === 'yes' ? value : !value;
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return undefined;
    if (['yes', 'y', 'true', 'checked', '1'].includes(text) && ['yes', 'no'].includes(normalizedChoice)) return normalizedChoice === 'yes';
    if (['no', 'n', 'false', 'unchecked', '0'].includes(text) && ['yes', 'no'].includes(normalizedChoice)) return normalizedChoice === 'no';
    if (normalizeChoiceToken(text) === normalizedChoice) return true;
    return undefined;
  };
  const getChoiceValue = (obj, path) => {
    const choicePath = choiceFromPath(path);
    if (!choicePath) return undefined;
    const parentRaw = getPath(obj, choicePath.parentPath);
    if (parentRaw && typeof parentRaw === 'object' && !Array.isArray(parentRaw) && choicePath.choice in parentRaw) {
      return coerce(parentRaw[choicePath.choice]);
    }
    const parentValue = coerce(parentRaw);
    const matched = valueMatchesChoice(parentValue, choicePath.choice);
    return matched === undefined ? undefined : matched;
  };
  const checkboxState = (value) => {
    if (typeof value === 'boolean') return value;
    const text = String(value ?? '').trim().toLowerCase();
    if (['true', 'yes', 'checked', '1', 'y'].includes(text)) return true;
    if (['false', 'no', 'unchecked', '0', 'n'].includes(text)) return false;
    return Boolean(value);
  };
  const isVisible = (el) => {
    if (!config.onlyVisibleControls) return true;
    if (el.type === 'hidden' || el.hidden) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  merged = normalizeMergedData(merged);
  const buildRoseRuleDefaults = (data) => {
    const defaults = {};
    const set = (path, value) => setPathLocal(defaults, path, value);
    set('living_situation.referral_source', 'Self-referral');
    const livingLocation = firstUsefulPathValue(data, ['living_situation.current_living_location']);
    if (textIncludesAny(livingLocation, ['sober living', 'recovery house', 'recovery sober', 'sober house'])) {
      set('living_situation.living_with', `Other residents at ${livingLocation}`);
    }

    for (let i = 1; i <= 3; i++) {
      const base = `substance_use.substance_${i}`;
      const hasSubstance = hasAnyUsefulPath(data, [
        `${base}.substance`,
        `${base}.age_first_use`,
        `${base}.amount_used`,
        `${base}.frequency_used`,
        `${base}.method`,
        `${base}.last_use_date`,
        `${base}.recent_pattern`,
        `${base}.consequences`,
        `${base}.sober_duration`
      ]);
      if (hasSubstance) {
        set(`${base}.amount_used`, 'Daily use at peak.');
        set(`${base}.frequency_used`, 'Daily use at peak.');
        set(`${base}.tolerance`, 'yes');
        set(`${base}.sees_use_as_problem`, 'yes');
        set(`${base}.tried_to_quit`, 'yes');
      } else if (i > 1) {
        [
          'substance',
          'age_first_use',
          'amount_used',
          'frequency_used',
          'method',
          'last_use_date',
          'days_used_last_30',
          'recent_pattern',
          'behavioral_changes',
          'consequences',
          'sober_duration'
        ].forEach(field => set(`${base}.${field}`, 'n/a'));
      }
    }
    if (!hasAnyUsefulPath(data, ['substance_use.substance_2.age_first_use', 'substance_use.substance_3.substance', 'substance_use.substance_3.age_first_use', 'substance_use.other_substances'])) {
      set('substance_use.other_substances', `${clientSubject()} reports no other substances used in the past.`);
    }

    const tobaccoText = firstUsefulPathValue(data, ['tobacco.amount_and_frequency']);
    if (textIncludesAny(tobaccoText, ['vape', 'vaping'])) set('tobacco.vape_contains_nicotine', 'yes');
    set('withdrawal.seizure_due_to_withdrawal', 'no');
    if (String(firstUsefulPathValue(data, ['withdrawal.experienced_withdrawal']) || '').trim().toLowerCase() === 'yes') {
      const substanceText = [1, 2, 3].flatMap(i => {
        const base = `substance_use.substance_${i}`;
        return [
          firstUsefulPathValue(data, [`${base}.substance`]),
          firstUsefulPathValue(data, [`${base}.age_first_use`]),
          firstUsefulPathValue(data, [`${base}.recent_pattern`]),
          firstUsefulPathValue(data, [`${base}.consequences`])
        ];
      }).join(' ');
      const marijuanaWithdrawal = textIncludesAny(substanceText, ['marijuana', 'cannabis', 'weed', 'thc']);
      set(
        'withdrawal.symptom_duration',
        marijuanaWithdrawal
          ? 'Reports symptoms lasting approximately 2-3 days'
          : 'Reports symptoms lasting approximately one week'
      );
      set('withdrawal.onset_after_last_use', 'Several hours after cessation of use');
    } else if (
      String(firstUsefulPathValue(data, ['withdrawal.experienced_withdrawal']) || '').trim().toLowerCase() === 'no' ||
      choiceIsNo(data, 'withdrawal.experienced_withdrawal')
    ) {
      set('withdrawal.no_history', true);
      set('withdrawal.symptom_duration', 'n/a');
      set('withdrawal.onset_after_last_use', 'n/a');
      set('withdrawal.management', 'n/a');
    }

    set('previous_substance_use_treatment.sponsor_or_mentor', 'no');
    set('mental_health.diagnosed_by', 'Unknown');
    if (choiceIsYes(data, 'mental_health.no_history') || noMentalHealthDiagnosisHistory(data)) {
      set('mental_health.no_history', true);
      set('mental_health.diagnosis_history', `${clientSubject()} reports no history of mental health diagnosis.`);
      set('mental_health.age_diagnosed', 'n/a');
      set('mental_health.diagnosed_by', 'n/a');
      set('mental_health.using_substances_at_diagnosis', 'n/a');
      set('mental_health.substance_use_impacted_diagnosis', 'n/a');
    } else if (!truthySelectionFlag(getPath(data, 'mental_health.no_history')) && hasAnyUsefulPath(data, ['mental_health.diagnosis_history'])) {
      set('mental_health.using_substances_at_diagnosis', `${clientSubject()} reports they were not using substances at the time of their diagnosis.`);
      set('mental_health.substance_use_impacted_diagnosis', 'n/a');
    }
    set('mental_health_treatment.not_interested_in_resources', false);
    if (choiceIsNo(data, 'mental_health_treatment.currently_working_with_psychiatrist') &&
      choiceIsNo(data, 'mental_health_treatment.currently_working_with_therapist')) {
      set('mental_health_treatment.mental_health_professionals_contact', 'n/a');
    }
    set('symptoms_suicide_self_harm.plan_to_end_life', 'no');
    set('symptoms_suicide_self_harm.means_or_plan_to_obtain_means', 'no');
    set('symptoms_suicide_self_harm.access_to_self_harm_means', 'n/a');
    if (choiceIsNo(data, 'symptoms_suicide_self_harm.hallucinations')) {
      set('symptoms_suicide_self_harm.eating_disorder_history', 'No');
    }
    if (choiceIsNo(data, 'symptoms_suicide_self_harm.history_suicidal_ideation')) {
      ['suicidal_ideation_life_context', 'suicidal_ideation_dates', 'suicidal_ideation_thoughts'].forEach(field => {
        set(`symptoms_suicide_self_harm.${field}`, 'n/a');
      });
    }
    if (choiceIsNo(data, 'symptoms_suicide_self_harm.history_suicide_attempts')) {
      ['attempt_count', 'attempt_dates_and_methods', 'under_influence_during_attempts', 'feelings_about_past_attempts', 'protective_factors', 'future_attempt_triggers'].forEach(field => {
        set(`symptoms_suicide_self_harm.${field}`, 'n/a');
      });
    }
    if (choiceIsNo(data, 'symptoms_suicide_self_harm.history_self_harm')) {
      ['self_harm_dates', 'self_harm_methods', 'feelings_about_past_self_harm'].forEach(field => {
        set(`symptoms_suicide_self_harm.${field}`, 'n/a');
      });
    }
    if (choiceIsNo(data, 'trauma_grief.current_grief_or_loss') || String(firstUsefulPathValue(data, ['trauma_grief.current_grief_or_loss']) || '').trim().toLowerCase() === 'no') {
      set('trauma_grief.grieving_what', 'n/a');
    }
    set('violence.current_thoughts_hurting_others', 'no');
    set('violence.perpetrator_domestic_abuse', 'no');
    set('legal.sex_crime_conviction', 'No');
    set('family.mother_medical_history', 'No');
    set('family.mother_mental_health_history', 'No');
    set('family.mother_substance_abuse_history', 'No');
    set('family.father_medical_history', 'No');
    set('family.father_mental_health_history', 'No');
    set('family.father_substance_abuse_history', 'No');
    set('family.has_siblings', 'yes');
    if (hasSpecificValue(getPath(data, 'spiritual_cultural.religion_affiliation'))) {
      const religion = firstSpecificPathValue(data, ['spiritual_cultural.religion_affiliation']);
      set('spiritual_cultural.active_in_religion', String(religion).trim().toLowerCase() === 'no' ? 'n/a' : 'Yes');
    } else {
      set('spiritual_cultural.religion_affiliation', 'No');
      set('spiritual_cultural.active_in_religion', 'n/a');
    }
    const growingUp = firstUsefulPathValue(data, ['family.growing_up_experience']);
    if (hasUsefulValue(growingUp)) set('spiritual_cultural.culture_values_raised_with', growingUp);
    set('medical.used_opiates_for_pain', 'No');
    if (String(firstUsefulPathValue(data, ['medical.used_opiates_for_pain']) || '').trim().toLowerCase() === 'no') {
      set('medical.opiates_prescribed', 'n/a');
    }
    if (choiceIsNo(data, 'medical.pain_issues')) {
      ['pain_location', 'pain_start', 'pain_helpers', 'pain_functioning_impact'].forEach(field => set(`medical.${field}`, 'n/a'));
    }
    if (choiceIsNo(data, 'medical.allergies')) {
      set('medical.allergy_reaction', 'n/a');
      set('medical.has_or_needs_epipen', 'n/a');
    } else if (choiceIsYes(data, 'medical.allergies') || hasUsefulValue(getPath(data, 'medical.allergy_reaction'))) {
      set('medical.has_or_needs_epipen', 'No');
    }
    if (choiceIsYes(data, 'medical.has_primary_care')) {
      set('medical.primary_care_clinic_or_doctor', 'Unknown by client');
      set('medical.primary_care_doctor_name', 'Unknown by client');
    } else if (choiceIsNo(data, 'medical.has_primary_care')) {
      set('medical.primary_care_clinic_or_doctor', 'n/a');
      set('medical.primary_care_doctor_name', 'n/a');
    }
    if (choiceIsNo(data, 'medical.dental_problems')) {
      set('medical.dentist_next_plan', `${clientSubject()} reports no dental problems or plans to see a dentist at this time.`);
    } else if (choiceIsYes(data, 'medical.dental_problems')) {
      const dentalConcern = firstSpecificPathValue(data, [
        'medical.dental_concern',
        'medical.dental_concerns',
        'medical.dental_problem_details',
        'medical.dental_issue',
        'medical.dental_issues'
      ]);
      set('medical.dentist_next_plan', `${clientSubject()} reports ${normalizedTextValue(dentalConcern || 'dental concerns')} and is not set up to see a dentist at this time.`);
    }
    for (let i = 1; i <= 3; i++) {
      const base = `medications.medication_${i}`;
      const hasMedication = hasAnyUsefulPath(data, [`${base}.name`, `${base}.dosage_frequency`]);
      if (hasMedication) {
        set(`${base}.dosage_frequency`, 'Unknown');
        set(`${base}.side_effects`, 'None reported.');
        set(`${base}.currently_taking`, 'yes');
        set(`${base}.mixed_with_alcohol_or_drugs`, 'no');
      } else {
        ['name', 'dosage_frequency', 'side_effects'].forEach(field => set(`${base}.${field}`, 'n/a'));
        set(`${base}.currently_taking.yes`, false);
        set(`${base}.currently_taking.no`, false);
        set(`${base}.mixed_with_alcohol_or_drugs.yes`, false);
        set(`${base}.mixed_with_alcohol_or_drugs.no`, false);
      }
    }
    set('sexual_history.practices_safe_sex', 'yes');
    set('sexual_history.partners_last_year', 'Information not provided');
    set('sexual_history.blackouts_prior_to_sex', 'no');
    set('sexual_history.paid_or_been_paid_for_sex', 'never');
    set('sexual_history.substance_use_impacted_sex_life', 'Information not provided');
    if (choiceIsYes(data, 'sexual_history.tested_std_hepatitis_hiv')) {
      set('sexual_history.wants_sexual_health_resources_if_no', 'no');
      set('sexual_history.additional_notes', 'n/a');
    }
    set('vocational.persons_living_on_income', 'Self');
    set('educational.clubs_or_sports', 'No');
    set('military.active_duty', 'n/a');
    set('military.deployed', 'n/a');
    set('military.highest_rank', 'n/a');
    set('military.discharge_status', 'n/a');
    set('military.substance_use_interfered_with_military', 'n/a');
    set('current_marital_status_and_living_environment.partner_uses_substances', 'Information not provided');
    set('current_marital_status_and_living_environment.substances_in_partner_living_space', 'n/a');
    set('additional_addiction_questions.gambling_concerns', 'No');
    set('additional_addiction_questions.spending_or_impulsive_spending_concerns', 'No');
    set('additional_addiction_questions.technology_use_concerns', 'No');

    const maritalStatus = String(firstUsefulPathValue(data, [
      'current_marital_status_and_living_environment.relationship_length',
      'current.relationship_length',
      'current.marital_status'
    ]) || '').trim().toLowerCase();
    if (['single', 'divorced', 'widowed'].includes(maritalStatus)) {
      set('current_marital_status_and_living_environment.relationship_description', 'n/a');
      set('current_marital_status_and_living_environment.substance_use_impacted_relationship', 'n/a');
      set('current_marital_status_and_living_environment.partner_uses_substances', 'n/a');
      set('current_marital_status_and_living_environment.substances_in_partner_living_space', 'n/a');
    } else if (maritalStatus) {
      const hasSubstanceHistory = hasAnyUsefulPath(data, [
        'substance_use.substance_1.age_first_use',
        'substance_use.substance_2.age_first_use',
        'substance_use.substance_3.age_first_use'
      ]);
      if (hasSubstanceHistory) set('current_marital_status_and_living_environment.substance_use_impacted_relationship', 'Yes');
    }
    const childrenText = String(firstUsefulPathValue(data, [
      'current_marital_status_and_living_environment.children_count_and_location',
      'current.children_count'
    ]) || '').trim().toLowerCase();
    if (childrenText === '0' || childrenText === 'none' || childrenText.includes('no children')) {
      set('current_marital_status_and_living_environment.cps_involvement', 'n/a');
      set('current_marital_status_and_living_environment.cps_case_details', 'n/a');
    } else if (choiceIsNo(data, 'current_marital_status_and_living_environment.cps_involvement') || String(firstUsefulPathValue(data, ['current_marital_status_and_living_environment.cps_involvement']) || '').trim().toLowerCase() === 'no') {
      set('current_marital_status_and_living_environment.cps_case_details', 'n/a');
    }
    return defaults;
  };
  const mergeDefaults = (base, override) => {
    const mergedDefaults = JSON.parse(JSON.stringify(base || {}));
    const merge = (target, source) => {
      for (const [key, value] of Object.entries(source || {})) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          target[key] = merge(target[key] || {}, value);
        } else {
          target[key] = value;
        }
      }
      return target;
    };
    return merge(mergedDefaults, override || {});
  };
  const formatValueForField = (value, matchedPath) => {
    if (/^case_management\.safety_planning\.(why_or_why_not|rationale|clinical_explanation)$/.test(String(matchedPath || ''))) {
      return formatAsamSafetyWhy(value);
    }
    const substanceMatch = String(matchedPath || '').match(/^substance_use\.substance_([123])\.age_first_use$/);
    if (!substanceMatch || isBlankLocal(value)) return value;
    if (substanceMatch[1] === '3') {
      return parseSubstanceAgeValue(value).age || value;
    }
    const substance = firstUsefulPathValue(merged, [`substance_use.substance_${substanceMatch[1]}.substance`]);
    const text = String(value);
    if (!hasUsefulValue(substance) || /age of first use:/i.test(text)) return value;
    return `${substance}\n\nAge of first use: ${text}`;
  };
  const defaultObj = mergeDefaults(buildRoseRuleDefaults(merged), config.defaultAnswersObject || {});
  normalizeMseOtherTextSelections(defaultObj, 'MSE default');
  normalizeMseSelectionConflicts(defaultObj);
  const suppressedMseNormalDefaultItems = new Set(
    [...new Set(Object.keys(mseNormalSelectionsByItem).map(canonicalMseItemKey))]
      .filter(itemKey => mseItemHasAbnormalOrOther(merged, itemKey))
  );
  if (suppressedMseNormalDefaultItems.size) {
    dataShapeWarnings.push(`MSE response has abnormal or Other findings for ${[...suppressedMseNormalDefaultItems].join(', ')}; normal/default answers for those items will be ignored.`);
  }
  const shouldSkipMseNormalDefaultPath = (path) => {
    const info = mseSelectionPathInfo(path);
    return Boolean(info && suppressedMseNormalDefaultItems.has(canonicalMseItemKey(info.itemKey)) && isMseNormalSelectionPath(path));
  };
  const defaultRowPaths = new Set((config.defaultAnswers || []).map(row => String(row.question || '').trim()).filter(Boolean));
  const mappedPaths = new Set();
  (config.fieldMap || []).forEach(item => (item.paths || []).forEach(path => mappedPaths.add(path)));
  const unusedDefaultRows = [...defaultRowPaths].filter(path => !mappedPaths.has(path));
  const findValue = (paths) => {
    const expandedPaths = [...paths];
    const addExpandedPath = (path) => {
      if (path && !expandedPaths.includes(path)) expandedPaths.push(path);
    };
    for (const rawPath of paths || []) {
      const path = String(rawPath || '');
      const bareOtherText = path.match(/^([^.]+)\.(other_text|narrative)$/);
      if (bareOtherText) {
        itemKeyAliases(bareOtherText[1]).forEach(key => addExpandedPath(`mse.items.${key}.${bareOtherText[2]}`));
      }
      const prefixedOtherText = path.match(/^mse\.items\.([^.]+)\.(other_text|narrative)$/);
      if (prefixedOtherText) {
        itemKeyAliases(prefixedOtherText[1]).forEach(key => addExpandedPath(`${key}.${prefixedOtherText[2]}`));
      }
      const bareChoice = path.match(/^([^.]+)\.([^.]+)$/);
      if (bareChoice && !['other_text', 'narrative'].includes(bareChoice[2])) {
        itemKeyAliases(bareChoice[1]).forEach(key => addExpandedPath(`mse.items.${key}.selections.${bareChoice[2] === 'other' ? 'Other' : bareChoice[2]}`));
      }
      const prefixedChoice = path.match(/^mse\.items\.([^.]+)\.selections\.([^.]+)$/);
      if (prefixedChoice) {
        itemKeyAliases(prefixedChoice[1]).forEach(key => addExpandedPath(`${key}.${pathSuffixForSelection(prefixedChoice[2])}`));
      }
    }
    if (paths.includes('educational.liked_school_when_younger') && !expandedPaths.includes('vocational.highest_education')) {
      expandedPaths.push('vocational.highest_education');
    }
    if (paths.includes('current.relationship_length') && !expandedPaths.includes('current.marital_status')) {
      expandedPaths.push('current.marital_status');
    }
    for (const path of expandedPaths) {
      const fromData = coerce(getPath(merged, path));
      if (!isBlankLocal(fromData)) return { value: formatValueForField(fromData, path), source: 'BastionGPT response', matchedPath: path };
    }
    for (const path of expandedPaths) {
      const fromDataChoice = getChoiceValue(merged, path);
      if (!isBlankLocal(fromDataChoice)) return { value: fromDataChoice, source: 'BastionGPT response', matchedPath: path };
    }
    for (const path of expandedPaths) {
      if (shouldSkipMseNormalDefaultPath(path)) continue;
      const fromDefault = coerce(getPath(defaultObj, path));
      if (!isBlankLocal(fromDefault)) return { value: formatValueForField(fromDefault, path), source: 'Rose default answer', matchedPath: path };
    }
    for (const path of expandedPaths) {
      if (shouldSkipMseNormalDefaultPath(path)) continue;
      const fromDefaultChoice = getChoiceValue(defaultObj, path);
      if (!isBlankLocal(fromDefaultChoice)) return { value: fromDefaultChoice, source: 'Rose default answer', matchedPath: path };
    }
    return { value: undefined, source: 'blank', matchedPath: paths?.[0] || '' };
  };
  const fire = (el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setNativeCheckboxChecked = (el, checked) => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
    if (descriptor?.set) descriptor.set.call(el, checked);
    else el.checked = checked;
  };
  const setCheckboxState = (el, checked) => {
    const requestedChecked = Boolean(checked);
    const details = {
      requestedChecked,
      checkedBefore: Boolean(el.checked),
      checkedAfterClick: undefined,
      checkedAfterNativeSetter: undefined,
      checkedAfterEvents: undefined,
      checkboxWriteStrategy: 'unchanged',
      checkboxSetSucceeded: false,
      disabled: Boolean(el.disabled),
      readOnly: Boolean(el.readOnly)
    };
    if (!details.disabled && Boolean(el.checked) !== requestedChecked) {
      el.click();
      details.checkboxWriteStrategy = 'click';
      details.checkedAfterClick = Boolean(el.checked);
    }
    if (Boolean(el.checked) !== requestedChecked) {
      setNativeCheckboxChecked(el, requestedChecked);
      details.checkboxWriteStrategy = details.checkboxWriteStrategy === 'click' ? 'click+nativeSetter' : 'nativeSetter';
      details.checkedAfterNativeSetter = Boolean(el.checked);
    }
    fire(el);
    details.checkedAfterEvents = Boolean(el.checked);
    details.checkboxSetSucceeded = details.checkedAfterEvents === requestedChecked;
    return details;
  };
  const setTextLikeValue = (el, value) => {
    const text = String(value);
    if (el.tagName === 'SELECT') {
      const normalized = text.trim().toLowerCase();
      const option = [...el.options].find(item =>
        String(item.value || '').trim().toLowerCase() === normalized ||
        String(item.textContent || '').trim().toLowerCase() === normalized
      );
      el.value = option ? option.value : text;
      return String(el.value);
    }
    if (el.getAttribute('contenteditable') === 'true') {
      el.textContent = text;
      return String(el.textContent || '');
    }
    el.value = text;
    return String(el.value);
  };
  const mseOtherTextItemKey = (path) => {
    const prefixed = String(path || '').match(/^mse\.items\.([^.]+)\.(other_text|narrative)$/);
    if (prefixed) return canonicalMseItemKey(prefixed[1]);
    const bare = String(path || '').match(/^([^.]+)\.(other_text|narrative)$/);
    return bare ? canonicalMseItemKey(bare[1]) : '';
  };
  const looksLikeMseRuntime = () => config.workflowMode === 'mse' || (config.fieldMap || []).some(mapItem => (mapItem.paths || []).some(path => /^mse\.items\./.test(String(path || ''))));
  const textLikeHasMseOtherPair = (el) => {
    if (!looksLikeMseRuntime() || isCheckboxLike(el)) return false;
    const tag = String(el?.tagName || '').toLowerCase();
    const type = String(el?.type || '').toLowerCase();
    if (!['textarea', 'select'].includes(tag) && !['text', 'search', 'email', 'tel', 'url', 'number', ''].includes(type) && !el?.isContentEditable) return false;
    return Boolean(findNearbyOtherCheckbox(el));
  };
  const mseItemKeyFromTextElement = (el) => {
    const row = el.closest('tr');
    for (let candidate = row, depth = 0; candidate && depth < 4; candidate = candidate.previousElementSibling, depth++) {
      const cells = [...candidate.children].filter(child => child.tagName === 'TD' || child.tagName === 'TH');
      for (const cell of cells.slice(0, 3)) {
        const text = String(cell.innerText || cell.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || /^(\d+\.?|&nbsp;|\s*)$/.test(text) || /^other:?$/i.test(text)) continue;
        const key = canonicalMseItemKey(text);
        if (key && key !== 'other') return key;
      }
    }
    return '';
  };
  const isCheckboxLike = (el) => ['checkbox', 'radio'].includes((el?.type || '').toLowerCase());
  const labelTextForInput = (el) => {
    const explicitLabel = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
    const label = explicitLabel || el.closest('label');
    return String(label?.innerText || label?.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const isOtherCheckbox = (el) => isCheckboxLike(el) && /^other:?$/i.test(labelTextForInput(el).replace(/\s+/g, ' ').trim());
  const findNearbyOtherCheckbox = (textEl) => {
    const row = textEl.closest('tr');
    if (row) {
      const rowOther = [...row.querySelectorAll('input[type="checkbox"], input[type="radio"]')].find(isOtherCheckbox);
      if (rowOther) return rowOther;
      for (let prev = row.previousElementSibling, depth = 0; prev && depth < 3; prev = prev.previousElementSibling, depth++) {
        const prevOther = [...prev.querySelectorAll('input[type="checkbox"], input[type="radio"]')].find(isOtherCheckbox);
        if (prevOther) return prevOther;
        if (/^\d+\.?\s+\S/.test(String(prev.innerText || prev.textContent || '').replace(/\s+/g, ' ').trim())) break;
      }
    }
    const container = textEl.closest('.question, .form-group, fieldset, table') || textEl.parentElement;
    return [...(container?.querySelectorAll('input[type="checkbox"], input[type="radio"]') || [])].find(isOtherCheckbox) || null;
  };
  const findMappedOtherCheckbox = (itemKey, fields) => {
    if (!itemKey) return null;
    const pathCandidates = itemKeyAliases(itemKey).flatMap(key => [
      `mse.items.${key}.selections.Other`,
      `mse.items.${key}.other`,
      `${key}.selections.Other`,
      `${key}.other`
    ]);
    const row = (config.fieldMap || []).find(mapItem => (mapItem.paths || []).some(path => pathCandidates.includes(path)));
    const el = row ? fields[row.fillIndex] : null;
    return isCheckboxLike(el) ? el : null;
  };
  const ensureMseOtherCheckboxForText = ({ textEl, itemKey, fields, result, base, dryRun }) => {
    const checkbox = findMappedOtherCheckbox(itemKey, fields) || findNearbyOtherCheckbox(textEl);
    if (!checkbox) {
      const detail = {
        ...base,
        action: 'linked_other_checkbox_missing',
        linkedItem: itemKey || '',
        warning: `MSE text field was written${itemKey ? ` for ${itemKey}` : ''}, but no nearby Other checkbox was found.`
      };
      result.warnings.push(detail.warning);
      result.trace.push(detail);
      return detail;
    }
    const before = Boolean(checkbox.checked);
    let checkboxDetails = {
      requestedChecked: true,
      checkedBefore: before,
      checkedAfterEvents: before,
      checkboxWriteStrategy: dryRun ? 'dry_run_linked_other' : 'linked_other',
      checkboxSetSucceeded: true,
      disabled: Boolean(checkbox.disabled),
      readOnly: Boolean(checkbox.readOnly)
    };
    if (!dryRun) checkboxDetails = setCheckboxState(checkbox, true);
    const finalValue = dryRun ? true : checkboxDetails.checkedAfterEvents;
    if (!before || !finalValue) {
      result.checkboxWritten++;
      if (finalValue) result.checkboxTrueWritten++;
      else result.checkboxFalseWritten++;
      if (!checkboxDetails.checkboxSetSucceeded) result.checkboxWriteFailures++;
    }
    const detail = {
      ...describeElement(checkbox, fields.indexOf(checkbox)),
      linkedFromFillIndex: base.fillIndex,
      linkedItem: itemKey || '',
      action: dryRun ? 'dry_run_linked_other_checkbox_write' : 'linked_other_checkbox_write',
      valueWritten: true,
      finalValue,
      ...checkboxDetails
    };
    result.trace.push(detail);
    return detail;
  };
  const clearMseNormalCheckboxesForOtherText = ({ itemKey, fields, result, base, dryRun }) => {
    const normalSelections = mseNormalSelectionsByItem[canonicalMseItemKey(itemKey)] || mseNormalSelectionsByItem[itemKey] || [];
    const cleared = new Set();
    for (const selection of normalSelections) {
      const pathCandidates = itemKeyAliases(itemKey).flatMap(key => [
        `mse.items.${key}.selections.${selection}`,
        `mse.items.${key}.${pathSuffixForSelection(selection)}`,
        `${key}.selections.${selection}`,
        `${key}.${pathSuffixForSelection(selection)}`
      ]);
      const row = (config.fieldMap || []).find(mapItem => (mapItem.paths || []).some(path => pathCandidates.includes(path)));
      const checkbox = row ? fields[row.fillIndex] : null;
      if (isCheckboxLike(checkbox) && Boolean(checkbox.checked)) cleared.add(checkbox);
    }
    if (!cleared.size) {
      const expectedLabels = new Set(normalSelections.map(selection => slugToken(selection)));
      for (const candidate of fields) {
        if (!isCheckboxLike(candidate) || !Boolean(candidate.checked)) continue;
        const described = describeElement(candidate, fields.indexOf(candidate));
        if (canonicalMseItemKey(described.questionText || '') !== canonicalMseItemKey(itemKey)) continue;
        if (expectedLabels.has(slugToken(described.label || described.answerText || labelTextForInput(candidate)))) cleared.add(candidate);
      }
    }
    for (const checkbox of cleared) {
      let checkboxDetails = {
        requestedChecked: false,
        checkedBefore: true,
        checkedAfterEvents: true,
        checkboxWriteStrategy: dryRun ? 'dry_run_linked_normal_clear' : 'linked_normal_clear',
        checkboxSetSucceeded: true,
        disabled: Boolean(checkbox.disabled),
        readOnly: Boolean(checkbox.readOnly)
      };
      if (!dryRun) checkboxDetails = setCheckboxState(checkbox, false);
      const finalValue = dryRun ? false : checkboxDetails.checkedAfterEvents;
      result.checkboxWritten++;
      if (finalValue) result.checkboxTrueWritten++;
      else result.checkboxFalseWritten++;
      if (!checkboxDetails.checkboxSetSucceeded) result.checkboxWriteFailures++;
      result.trace.push({
        ...describeElement(checkbox, fields.indexOf(checkbox)),
        linkedFromFillIndex: base.fillIndex,
        linkedItem: itemKey,
        action: dryRun ? 'dry_run_linked_normal_checkbox_clear' : 'linked_normal_checkbox_clear',
        valueWritten: false,
        finalValue,
        ...checkboxDetails
      });
    }
  };
  const dataQnFieldIdForElement = (el) => el?.getAttribute?.('data-qn-field-id') || el?.closest?.('[data-qn-field-id]')?.getAttribute('data-qn-field-id') || '';
  const describeElement = (el, fillIndex) => ({
    fillIndex,
    tag: el.tagName,
    type: el.type || '',
    id: el.id || '',
    name: el.name || '',
    className: String(el.className || ''),
    dataQnFieldId: dataQnFieldIdForElement(el),
    checked: (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : undefined,
    disabled: Boolean(el.disabled),
    readOnly: Boolean(el.readOnly),
    ariaChecked: el.getAttribute('aria-checked') || '',
    outerHTMLPreview: String(el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 260),
    contextText: String((el.closest('tr, .question, .form-group, label, div') || el.parentElement || el).innerText || '').replace(/\s+/g, ' ').slice(0, 260)
  });
  try {
    const selector = config.selector || 'textarea.qn-textarea, input.qn-editable-cb';
    const fields = [...document.querySelectorAll(selector)].filter(isVisible);
    const fieldsByDataQnFieldId = new Map();
    fields.forEach(el => {
      const id = dataQnFieldIdForElement(el);
      if (id && !fieldsByDataQnFieldId.has(id)) fieldsByDataQnFieldId.set(id, el);
    });
    const result = {
      event: 'fill',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      selector,
      found: fields.length,
      expected: config.expectedFieldCount,
      dryRun,
      written: 0,
      defaultWritten: 0,
      responseWritten: 0,
      checkboxWritten: 0,
      checkboxTrueWritten: 0,
      checkboxFalseWritten: 0,
      checkboxWriteFailures: 0,
      skipped: 0,
      missing: [],
      warnings: [...dataShapeWarnings],
      unusedDefaultRows,
      trace: []
    };
    if (config.expectedFieldCount && fields.length !== config.expectedFieldCount) {
      result.warnings.push(`Expected ${config.expectedFieldCount} fields, found ${fields.length}. Review mapping before using on a live record.`);
    }
    const normalizeFieldLabelText = (value) => String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[?:]+$/g, '');
    const nearbyRowText = (row, direction, maxDepth = 6) => {
      const chunks = [];
      for (let next = row?.[direction], depth = 0; next && depth < maxDepth; next = next[direction], depth++) {
        const text = String(next.innerText || next.textContent || '').replace(/\s+/g, ' ').trim();
        if (text) chunks.push(text);
      }
      return chunks.join(' ');
    };
    const findAsamSafetyPlanningControlByLabel = (item) => {
      if (config.workflowMode !== 'asam') return null;
      const paths = item.paths || [];
      if (!paths.some(path => /^case_management\.safety_planning\./.test(String(path || '')))) return null;
      const label = normalizeFieldLabelText(item.label);
      if (!label) return null;
      const rows = [...document.querySelectorAll('tr')].map((row, order) => {
        const cells = [...row.children].filter(child => ['TD', 'TH'].includes(child.tagName));
        const labelCell = cells.find(cell => !cell.querySelector(selector));
        const labelText = normalizeFieldLabelText(labelCell?.innerText || labelCell?.textContent || '');
        if (labelText !== label) return null;
        const controls = [...row.querySelectorAll(selector)].filter(isVisible);
        if (!controls.length) return null;
        const beforeText = nearbyRowText(row, 'previousElementSibling');
        const afterText = nearbyRowText(row, 'nextElementSibling', 2);
        const context = `${beforeText} ${afterText}`.toLowerCase();
        let score = order;
        if (/is additional safety planning needed/i.test(context)) score += 10000;
        if (/dimension\s+6|recovery\/living environment|asam/i.test(context)) score += 1000;
        return { el: controls[controls.length - 1], score };
      }).filter(Boolean);
      rows.sort((a, b) => b.score - a.score);
      return rows[0]?.el || null;
    };
    const findTreatmentPlanControlByLabel = (item) => {
      if (config.workflowMode !== 'treatment') return null;
      const semantic = String(item.treatmentField || '').trim();
      if (!semantic) return null;
      const rows = [...document.querySelectorAll('tr')];
      const rowIndex = (row) => rows.indexOf(row);
      const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const problemNumberForRow = (row) => {
        const start = rowIndex(row);
        for (let index = start; index >= 0; index--) {
          const match = normalize(rows[index]?.innerText || rows[index]?.textContent || '').match(/\bproblem\s*#\s*([1-3])\b/);
          if (match) return Number(match[1]);
        }
        return 0;
      };
      const precedingRowText = (row, count = 4) => {
        const chunks = [];
        for (let previous = row?.previousElementSibling, depth = 0; previous && depth < count; previous = previous.previousElementSibling, depth++) {
          const text = normalize(previous.innerText || previous.textContent || '');
          if (/\bproblem\s*#\s*[1-3]\b/.test(text)) break;
          if (text) chunks.push(text);
        }
        return chunks.join(' ');
      };
      const localCellText = (el) => {
        const cell = el.closest('td, th');
        if (!cell) return '';
        const chunks = [];
        for (let previous = cell.previousElementSibling; previous; previous = previous.previousElementSibling) {
          const text = normalize(previous.innerText || previous.textContent || '');
          if (text) chunks.unshift(text);
        }
        return chunks.join(' ');
      };
      const patterns = {
        assessment_date: /\bassessment date\b/,
        strengths: /\bstrengths\b/,
        risk_factors: /\brisk factors\b/,
        problem_statement: /\bproblem statement\b/,
        goal: /\bgoal\b/,
        objectives: /\bobjectives\b/,
        target_date: /\b(target date|estimated length of treatment)\b/,
        completion_date: /\bcompletion date\b/,
        therapeutic_interventions: /\btherapeutic interventions\b/,
        review_comments: /\breview\s*\/?\s*comments\b/,
        safety_planning: /\bsafety planning\b/,
        next_review_date: /\bnext review(?: date| on or before)?\b/
      };
      const pattern = patterns[semantic];
      if (!pattern) return null;
      const expectedProblem = Number(item.problemNumber || 0);
      const candidates = fields.map((el, index) => {
        const row = el.closest('tr');
        if (!row) return null;
        const problemNumber = problemNumberForRow(row);
        if (expectedProblem && problemNumber !== expectedProblem) return null;
        if (!expectedProblem && problemNumber && !['safety_planning', 'next_review_date'].includes(semantic)) return null;
        const cellText = localCellText(el);
        const rowText = normalize(row.innerText || row.textContent || '');
        const previousText = precedingRowText(row);
        let score = 0;
        if (pattern.test(cellText)) score += 120;
        if (pattern.test(rowText)) score += 90;
        if (pattern.test(previousText)) score += 70;
        if (!score) return null;
        if (expectedProblem && problemNumber === expectedProblem) score += 40;
        if (semantic === 'assessment_date' && /\bdate of service plan\b/.test(cellText) && !/\bassessment date\b/.test(cellText)) score -= 200;
        if (semantic === 'target_date' && /\bcompletion date\b/.test(cellText) && !/\btarget date\b/.test(cellText)) score -= 200;
        if (semantic === 'completion_date' && /\btarget date\b/.test(cellText) && !/\bcompletion date\b/.test(cellText)) score -= 200;
        return { el, score, index, problemNumber, cellText, rowText, previousText };
      }).filter(candidate => candidate && candidate.score > 0);
      candidates.sort((a, b) => b.score - a.score || a.index - b.index);
      return candidates[0] || null;
    };
    const resolveMappedField = (item) => {
      const mappedDataQnFieldId = String(item.dataQnFieldId || '').trim();
      if (mappedDataQnFieldId && fieldsByDataQnFieldId.has(mappedDataQnFieldId)) {
        return { el: fieldsByDataQnFieldId.get(mappedDataQnFieldId), strategy: 'data-qn-field-id' };
      }
      if (mappedDataQnFieldId && config.workflowMode === 'diagnostics') {
        return { el: null, strategy: 'missing-data-qn-field-id' };
      }
      const byAsamSafetyLabel = findAsamSafetyPlanningControlByLabel(item);
      if (byAsamSafetyLabel) return { el: byAsamSafetyLabel, strategy: 'asam-safety-label-row' };
      if (config.workflowMode === 'treatment') {
        const treatmentMatch = findTreatmentPlanControlByLabel(item);
        return treatmentMatch
          ? { el: treatmentMatch.el, strategy: `treatment-label-section(score:${treatmentMatch.score})` }
          : { el: null, strategy: 'treatment-label-not-found' };
      }
      return { el: fields[item.fillIndex], strategy: 'fill-index' };
    };
    for (const item of (config.fieldMap || [])) {
      const resolvedField = resolveMappedField(item);
      const el = resolvedField.el;
      if (!el) {
        const missing = {
          action: 'missing_field',
          fillIndex: item.fillIndex,
          dataQnFieldId: item.dataQnFieldId || '',
          label: item.label || '',
          section: item.section || '',
          resolutionStrategy: resolvedField.strategy,
          paths: item.paths || []
        };
        result.missing.push(missing);
        result.trace.push(missing);
        continue;
      }
      const resolvedFillIndex = fields.indexOf(el);
      const before = (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : String(el.value || '');
      const foundValue = findValue(item.paths || []);
      const base = {
        ...describeElement(el, resolvedFillIndex >= 0 ? resolvedFillIndex : item.fillIndex),
        mappedFillIndex: item.fillIndex,
        resolutionStrategy: resolvedField.strategy,
        paths: item.paths || [],
        matchedPath: foundValue.matchedPath,
        source: foundValue.source,
        previousValue: before
      };
      if (item.preserveNonBlank && String(before || '').trim()) {
        result.skipped++;
        const proposed = isBlankLocal(foundValue.value) ? '' : String(foundValue.value);
        if (proposed && proposed.trim() !== String(before).trim()) {
          result.warnings.push(`${item.label || item.treatmentField || 'Mapped field'} already contains "${String(before).slice(0, 120)}"; preserved it instead of replacing it with "${proposed.slice(0, 120)}".`);
        }
        result.trace.push({
          ...base,
          action: 'skip_preserve_existing',
          proposedValue: proposed,
          finalValue: before
        });
        continue;
      }
      if (isBlankLocal(foundValue.value)) {
        result.skipped++;
        result.trace.push({ ...base, action: 'skip_blank', valueWritten: '' });
        continue;
      }
      let valueToWrite = foundValue.value;
      let finalValue;
      let checkboxDetails;
      if (!dryRun) {
        if ((el.type || '').toLowerCase() === 'checkbox' || (el.type || '').toLowerCase() === 'radio') {
          checkboxDetails = setCheckboxState(el, checkboxState(valueToWrite));
          finalValue = checkboxDetails.checkedAfterEvents;
        } else {
          finalValue = setTextLikeValue(el, valueToWrite);
          fire(el);
        }
      } else {
        finalValue = ['checkbox', 'radio'].includes((el.type || '').toLowerCase()) ? checkboxState(valueToWrite) : String(valueToWrite);
        if (['checkbox', 'radio'].includes((el.type || '').toLowerCase())) {
          checkboxDetails = {
            requestedChecked: finalValue,
            checkedBefore: Boolean(el.checked),
            checkedAfterEvents: Boolean(el.checked),
            checkboxWriteStrategy: 'dry_run',
            checkboxSetSucceeded: true,
            disabled: Boolean(el.disabled),
            readOnly: Boolean(el.readOnly)
          };
        }
      }
      const linkedMseOtherItem = !isCheckboxLike(el) && looksLikeMseRuntime()
        ? ((item.paths || []).map(mseOtherTextItemKey).find(Boolean) || mseItemKeyFromTextElement(el))
        : '';
      if (!isCheckboxLike(el) && looksLikeMseRuntime() && String(valueToWrite ?? '').trim() && (linkedMseOtherItem || textLikeHasMseOtherPair(el))) {
        ensureMseOtherCheckboxForText({ textEl: el, itemKey: linkedMseOtherItem, fields, result, base, dryRun });
        if (linkedMseOtherItem) clearMseNormalCheckboxesForOtherText({ itemKey: linkedMseOtherItem, fields, result, base, dryRun });
      }
      result.written++;
      if (foundValue.source === 'Rose default answer') result.defaultWritten++;
      if (foundValue.source === 'BastionGPT response') result.responseWritten++;
      if (['checkbox', 'radio'].includes((el.type || '').toLowerCase())) {
        result.checkboxWritten++;
        if (finalValue) result.checkboxTrueWritten++;
        else result.checkboxFalseWritten++;
        if (checkboxDetails && !checkboxDetails.checkboxSetSucceeded) result.checkboxWriteFailures++;
      }
      result.trace.push({ ...base, ...(checkboxDetails || {}), action: dryRun ? 'dry_run_write' : 'write', valueWritten: valueToWrite, finalValue });
    }
    return result;
  } catch (err) { return { error: err.message }; }
}
function buildRuntimeConfig() {
  const rows = normalizedDefaultRows();
  return {
    ...activeConfig,
    defaultAnswers: rows,
    defaultAnswersObject: defaultRowsToObject(rows)
  };
}
function buildQuickNotesRuntimeConfig() {
  return {
    ...activeQuickNotesConfig,
    defaultAnswersObject: {}
  };
}
function buildMseRuntimeConfig() {
  const mode = workflowMode('mse');
  const rows = getWorkflowDefaultRows('mse');
  return {
    workflowMode: 'mse',
    selector: mode.selector || 'textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), [contenteditable="true"]',
    onlyVisibleControls: mode.onlyVisibleControls ?? true,
    expectedFieldCount: mode.expectedFieldCount,
    fieldMap: mode.fieldMap || [],
    defaultAnswers: rows,
    defaultAnswersObject: defaultRowsToObject(rows)
  };
}
function buildAsamRuntimeConfig() {
  const mode = workflowMode('asam');
  const rows = getWorkflowDefaultRows('asam');
  return {
    workflowMode: 'asam',
    selector: mode.selector || 'textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), [contenteditable="true"]',
    onlyVisibleControls: mode.onlyVisibleControls ?? false,
    expectedFieldCount: mode.expectedFieldCount,
    fieldMap: mode.fieldMap || [],
    defaultAnswers: rows,
    defaultAnswersObject: defaultRowsToObject(rows)
  };
}
function buildDiagnosticsRuntimeConfig() {
  const mode = workflowMode('diagnostics');
  const rows = getWorkflowDefaultRows('diagnostics');
  return {
    workflowMode: 'diagnostics',
    selector: mode.selector || 'textarea, select, input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), [contenteditable="true"]',
    onlyVisibleControls: mode.onlyVisibleControls ?? false,
    expectedFieldCount: mode.expectedFieldCount,
    fieldMap: mode.fieldMap || [],
    defaultAnswers: rows,
    defaultAnswersObject: defaultRowsToObject(rows)
  };
}
function buildTreatmentRuntimeConfig() {
  const mode = workflowMode('treatment');
  const treatmentSelector = '#notePanels .quickNoteFormBlock textarea.qn-textarea, #notePanels .quickNoteFormBlock input.qn-editable-cb';
  const fieldMap = [
    { dataQnFieldId: '10000', treatmentField: 'assessment_date', label: 'Assessment Date', paths: ['treatment_plan.assessment_date'] },
    { dataQnFieldId: '10001', treatmentField: 'strengths', label: 'Strengths', paths: ['treatment_plan.strengths'] },
    { dataQnFieldId: '10002', treatmentField: 'risk_factors', label: 'Risk Factors', paths: ['treatment_plan.risk_factors'] }
  ];
  for (let problemNumber = 1; problemNumber <= 3; problemNumber++) {
    const base = `treatment_plan.problems.${problemNumber - 1}`;
    const firstFieldId = 10003 + ((problemNumber - 1) * 7);
    fieldMap.push(
      { dataQnFieldId: String(firstFieldId), treatmentField: 'problem_statement', problemNumber, label: `Problem ${problemNumber} Statement`, paths: [`${base}.problem_statement`] },
      { dataQnFieldId: String(firstFieldId + 1), treatmentField: 'goal', problemNumber, label: `Problem ${problemNumber} Goal`, paths: [`${base}.goal`] },
      { dataQnFieldId: String(firstFieldId + 2), treatmentField: 'objectives', problemNumber, label: `Problem ${problemNumber} Objectives`, paths: [`${base}.objectives_text`] },
      { dataQnFieldId: String(firstFieldId + 3), treatmentField: 'target_date', problemNumber, label: `Problem ${problemNumber} Target Date`, paths: [`${base}.target_date`, `${base}.estimated_length_of_treatment`] },
      { dataQnFieldId: String(firstFieldId + 4), treatmentField: 'completion_date', problemNumber, label: `Problem ${problemNumber} Completion Date`, paths: [`${base}.completion_date`] },
      { dataQnFieldId: String(firstFieldId + 5), treatmentField: 'therapeutic_interventions', problemNumber, label: `Problem ${problemNumber} Therapeutic Interventions`, paths: [`${base}.therapeutic_interventions_text`] },
      { dataQnFieldId: String(firstFieldId + 6), treatmentField: 'review_comments', problemNumber, label: `Problem ${problemNumber} Review/Comments`, paths: [`${base}.review_comments`] }
    );
  }
  fieldMap.push(
    { dataQnFieldId: '10024', treatmentField: 'safety_planning', label: 'Safety Planning', paths: ['treatment_plan.safety_planning'] }
  );
  return {
    workflowMode: 'treatment',
    selector: treatmentSelector,
    onlyVisibleControls: mode.onlyVisibleControls ?? false,
    expectedFieldCount: 27,
    fieldMap,
    defaultAnswers: [],
    defaultAnswersObject: {}
  };
}
function validateQuickNotesResponse() {
  const raw = $('quicknotesResp')?.value.trim() || '';
  if (!raw) return {};
  return JSON.parse(raw);
}
async function saveQuickNotesResponse() {
  await chrome.storage.local.set({ [STORAGE_KEYS.quicknotesResponse]: $('quicknotesResp')?.value || '' });
}
function validateMseResponse() {
  const response = $('mseResp')?.value.trim() || '';
  if (!response) throw new Error('Paste the MSE Part 2 response first.');
  const summary = {
    characterCount: response.length,
    lineCount: response.split(/\r?\n/).filter(line => line.trim()).length,
    hasRequiredMseLanguage: /appearance|attitude|mood|affect|speech|thought|cognition|insight|judg(e)?ment/i.test(response),
    expectedItems: MSE_REQUIRED_ITEMS.length
  };
  if (!response.startsWith('{')) {
    return {
      ...summary,
      warnings: ['MSE response is saved as free text. The current prompt expects JSON so Rose can verify each screenshot row separately.']
    };
  }
  const parsed = JSON.parse(response);
  const items = parsed?.mse?.items || parsed?.items || parsed?.mse || {};
  const missingItems = MSE_REQUIRED_ITEMS.filter(item => !items[item]);
  const otherWithoutNarrative = Object.entries(items)
    .filter(([, value]) => {
      const selections = Array.isArray(value?.selections) ? value.selections : [];
      return selections.some(selection => String(selection).toLowerCase() === 'other') && !String(value?.other_text || value?.narrative || '').trim();
    })
    .map(([key]) => key);
  const normalSelectionsByItem = {
    build_stature: ['Within Normal Limits'],
    posture: ['Within Normal Limits'],
    activity: ['Within Normal Limits'],
    thought_process: ['Logical'],
    perception: ['Within normal limits'],
    hallucinations: ['Denied', 'None evidenced'],
    thought_content: ['Within normal limits'],
    delusions: ['None reported'],
    cognition: ['Within normal limits'],
    insight: ['Within normal limits'],
    judgment: ['Within normal limits'],
    judgement: ['Within normal limits']
  };
  const normalizeSelection = (value) => String(value || '').trim().toLowerCase();
  const selectionConflicts = Object.entries(normalSelectionsByItem)
    .filter(([key, normalSelections]) => {
      const selections = Array.isArray(items[key]?.selections) ? items[key].selections : [];
      const otherText = String(items[key]?.other_text || items[key]?.narrative || '').trim();
      if (!selections.length) return false;
      const normalSet = new Set(normalSelections.map(normalizeSelection));
      return selections.some(selection => normalSet.has(normalizeSelection(selection))) &&
        (otherText || selections.some(selection => !normalSet.has(normalizeSelection(selection))));
    })
    .map(([key]) => key);
  return {
    ...summary,
    parsedJson: true,
    topLevelKeys: Object.keys(parsed),
    presentItems: MSE_REQUIRED_ITEMS.length - missingItems.length,
    missingItems,
    otherWithoutNarrative,
    selectionConflicts,
    warnings: [
      ...(missingItems.length ? [`Missing MSE items: ${missingItems.join(', ')}`] : []),
      ...(otherWithoutNarrative.length ? [`Other selected without narrative: ${otherWithoutNarrative.join(', ')}`] : []),
      ...(selectionConflicts.length ? [`Normal/default selections conflict with abnormal or Other selections: ${selectionConflicts.join(', ')}. Fill will remove the normal/default selections before writing.`] : [])
    ]
  };
}
async function saveMseResponse() {
  await chrome.storage.local.set({ [STORAGE_KEYS.mseResponse]: $('mseResp')?.value || '' });
}
function normalizeAsamKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/nat\./g, 'natural')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
function getObjectValueByAliases(container, aliases) {
  if (!container || typeof container !== 'object' || Array.isArray(container)) return undefined;
  const aliasSet = new Set((aliases || []).map(normalizeAsamKey));
  for (const [key, value] of Object.entries(container)) {
    if (aliasSet.has(normalizeAsamKey(key))) return value;
  }
  return undefined;
}
function firstAsamObject(...values) {
  return values.find(value => value && typeof value === 'object' && !Array.isArray(value));
}
function asamText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
function parseFunctioningScore(value) {
  if (typeof value === 'number' && value >= 0 && value <= 3) return value;
  if (typeof value === 'boolean') return undefined;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of ['score', 'rating', 'severity_number', 'severityNumber', 'level', 'number', 'value']) {
      const parsed = parseFunctioningScore(value[key]);
      if (parsed !== undefined) return parsed;
    }
    const selections = value.selections || value.scores || value.scoreSelections;
    if (selections && typeof selections === 'object' && !Array.isArray(selections)) {
      for (const [label, selected] of Object.entries(selections)) {
        if (selected === true || String(selected).toLowerCase() === 'true') {
          const byNumber = Number(label);
          if (Number.isInteger(byNumber) && byNumber >= 0 && byNumber <= 3) return byNumber;
          const byLabel = ASAM_FUNCTIONING_LABELS.findIndex(item => normalizeAsamKey(item) === normalizeAsamKey(label));
          if (byLabel >= 0) return byLabel;
        }
      }
    }
    const parsedSeverity = parseFunctioningScore(value.severity || value.label);
    if (parsedSeverity !== undefined) return parsedSeverity;
  }
  const text = asamText(value);
  if (!text) return undefined;
  const leadingNumber = text.match(/^\D*([0-3])\b/);
  if (leadingNumber) return Number(leadingNumber[1]);
  const parenthetical = text.match(/\(([0-3])\s*(?:none|mild|moderate|severe)?\)/i);
  if (parenthetical) return Number(parenthetical[1]);
  const severityLabel = ASAM_FUNCTIONING_LABELS.findIndex(label => new RegExp(`\\b${label}\\b`, 'i').test(text));
  return severityLabel >= 0 ? severityLabel : undefined;
}
function parseAsamSeverityNumber(value) {
  if (typeof value === 'number' && value >= 0 && value <= 4) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of ['severity', 'severity_number', 'severityNumber', 'rating', 'score', 'level', 'number']) {
      const parsed = parseAsamSeverityNumber(value[key]);
      if (parsed !== undefined) return parsed;
    }
  }
  const text = asamText(value);
  if (!text) return undefined;
  const severityLine = text.match(/severity:\s*([0-4])\s*:?\s*(none|mild|moderate|high|severe)?/i);
  if (severityLine) return Number(severityLine[1]);
  const parenthetical = text.match(/\(([0-4])\s*(?:none|mild|moderate|high|severe)?\)/i);
  if (parenthetical) return Number(parenthetical[1]);
  const leadingNumber = text.match(/^\D*([0-4])\b/);
  if (leadingNumber) return Number(leadingNumber[1]);
  const labelIndex = ASAM_DIMENSION_LABELS.findIndex(label => new RegExp(`\\b${label}\\b`, 'i').test(text));
  return labelIndex >= 0 ? labelIndex : undefined;
}
function asamSeverityLabel(value, fallbackNumber) {
  const text = asamText(value);
  const matched = ASAM_DIMENSION_LABELS.find(label => new RegExp(`\\b${label}\\b`, 'i').test(text));
  return matched || ASAM_DIMENSION_LABELS[fallbackNumber] || '';
}
function firstUsefulAsamText(...values) {
  for (const value of values) {
    const text = asamText(value);
    if (text) return text;
  }
  return '';
}
function formatAsamDimensionText(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (/^severity:/i.test(text) || /^dimension\s+\d+/i.test(text)) return text;
    const severityNumber = parseAsamSeverityNumber(text);
    if (severityNumber === undefined) return text;
    return `Severity: ${severityNumber}: ${asamSeverityLabel(text, severityNumber)}\n\n${text}`;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const severityNumber = parseAsamSeverityNumber(value);
  const label = asamSeverityLabel(value.label || value.severity || value.severity_label || value.severityLabel, severityNumber);
  const componentText = [
    value.clinical_justification || value.justification || value.rationale || value.clinical_rationale,
    value.functional_impact || value.functioning || value.impact,
    value.risk_implications || value.risk || value.risk_level,
    value.level_of_care_support || value.loc_support || value.level_of_care_rationale
  ].map(asamText).filter(Boolean).join(' ');
  const narrative = firstUsefulAsamText(
    value.text,
    value.narrative,
    value.paragraph,
    value.summary,
    componentText
  );
  if (!narrative) return '';
  if (/^severity:/i.test(narrative)) return narrative;
  if (severityNumber === undefined) return narrative;
  return `Severity: ${severityNumber}: ${label}\n\n${narrative}`;
}
function findAsamDimensionValue(root, dimensionNumber) {
  const containers = [
    root?.case_management?.asam_criteria,
    root?.case_management?.asamCriteria,
    root?.case_management?.asam,
    root?.asam_criteria,
    root?.asamCriteria,
    root?.asam,
    root?.dimensions,
    root?.case_management?.dimensions
  ].filter(Boolean);
  const keys = [
    `dimension_${dimensionNumber}`,
    `dimension${dimensionNumber}`,
    `Dimension ${dimensionNumber}`,
    String(dimensionNumber)
  ];
  for (const container of containers) {
    if (typeof container === 'string') {
      const nextMarker = dimensionNumber < 6 ? `Dimension\\s+${dimensionNumber + 1}` : '$';
      const match = container.match(new RegExp(`(Dimension\\s+${dimensionNumber}[\\s\\S]*?)(?=${nextMarker})`, 'i'));
      if (match) return match[1].trim();
    }
    const value = getObjectValueByAliases(container, keys);
    if (value !== undefined) return value;
  }
  return undefined;
}
function findAsamSafetyValue(root, keys) {
  const containers = [
    root?.case_management?.safety_planning,
    root?.case_management?.safetyPlanning,
    root?.safety_planning,
    root?.safetyPlanning,
    root?.safety,
    root?.case_management
  ].filter(Boolean);
  for (const container of containers) {
    const value = getObjectValueByAliases(container, keys);
    if (value !== undefined) return value;
  }
  return undefined;
}
function normalizeYesNoText(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = asamText(value);
  if (/^yes\b/i.test(text)) return 'Yes';
  if (/^no\b/i.test(text)) return 'No';
  return text;
}
function normalizeAsamResponseForFill(parsed) {
  const normalized = JSON.parse(JSON.stringify(parsed || {}));
  normalized.case_management = firstAsamObject(normalized.case_management, normalized.caseManagement, normalized.part3, {}) || {};
  const sourceRoot = {
    ...normalized,
    case_management: firstAsamObject(parsed?.case_management, parsed?.caseManagement, parsed?.part3, parsed) || {}
  };
  const caseManagement = normalized.case_management;
  caseManagement.items = firstAsamObject(caseManagement.items, caseManagement.functioning, {}) || {};

  const functioningContainers = [
    sourceRoot.case_management?.items,
    sourceRoot.case_management?.functioning,
    sourceRoot.case_management?.case_management_assessment,
    sourceRoot.functioning,
    sourceRoot.case_management_assessment,
    sourceRoot.case_management
  ].filter(Boolean);
  for (const item of ASAM_FUNCTIONING_ITEMS) {
    const aliases = [item.key, item.label, ...(item.aliases || [])];
    let sourceValue;
    for (const container of functioningContainers) {
      sourceValue = getObjectValueByAliases(container, aliases);
      if (sourceValue !== undefined) break;
    }
    const score = parseFunctioningScore(sourceValue);
    if (score === undefined) continue;
    const target = firstAsamObject(caseManagement.items[item.key], {}) || {};
    target.score = score;
    target.severity = ASAM_FUNCTIONING_LABELS[score];
    target.selections = {};
    ASAM_FUNCTIONING_LABELS.forEach((label, index) => {
      target.selections[label] = index === score;
    });
    caseManagement.items[item.key] = target;
  }

  caseManagement.asam_criteria = firstAsamObject(caseManagement.asam_criteria, caseManagement.asamCriteria, {}) || {};
  for (let dimension = 1; dimension <= 6; dimension++) {
    const sourceValue = findAsamDimensionValue(sourceRoot, dimension);
    const text = formatAsamDimensionText(sourceValue);
    if (!text) continue;
    const target = firstAsamObject(caseManagement.asam_criteria[`dimension_${dimension}`], {}) || {};
    target.text = text;
    caseManagement.asam_criteria[`dimension_${dimension}`] = target;
  }

  caseManagement.safety_planning = firstAsamObject(caseManagement.safety_planning, caseManagement.safetyPlanning, {}) || {};
  const safetyNeeded = findAsamSafetyValue(sourceRoot, [
    'additional_safety_planning_needed',
    'is_additional_safety_planning_needed',
    'additional safety planning needed',
    'needed'
  ]);
  const safetyWhy = findAsamSafetyValue(sourceRoot, [
    'why_or_why_not',
    'why or why not',
    'rationale',
    'reason',
    'clinical_explanation',
    'explanation'
  ]);
  if (safetyNeeded !== undefined) {
    caseManagement.safety_planning.additional_safety_planning_needed = normalizeYesNoText(safetyNeeded);
  }
  if (safetyWhy !== undefined) {
    caseManagement.safety_planning.why_or_why_not = asamText(safetyWhy);
  }
  return normalized;
}
function validateAsamResponse() {
  const response = $('asamResp')?.value.trim() || '';
  if (!response) throw new Error('Paste the Case Management and ASAM Part 3 response first.');
  const parsed = JSON.parse(response);
  const normalized = normalizeAsamResponseForFill(parsed);
  const items = normalized.case_management?.items || {};
  const missingFunctioning = [];
  const invalidFunctioning = [];
  for (const item of ASAM_FUNCTIONING_ITEMS) {
    const selections = items[item.key]?.selections || {};
    const selected = ASAM_FUNCTIONING_LABELS.filter(label => selections[label] === true);
    if (!selected.length) missingFunctioning.push(item.label);
    if (selected.length > 1) invalidFunctioning.push(item.label);
  }
  const dimensions = normalized.case_management?.asam_criteria || {};
  const missingDimensions = [];
  const dimensionSeverityWarnings = [];
  for (let dimension = 1; dimension <= 6; dimension++) {
    const text = String(dimensions[`dimension_${dimension}`]?.text || '').trim();
    if (!text) {
      missingDimensions.push(`Dimension ${dimension}`);
      continue;
    }
    const severityNumber = parseAsamSeverityNumber(text);
    const expectedLabel = ASAM_DIMENSION_LABELS[severityNumber];
    const hasMatchingSeverityLabel = severityNumber !== undefined && (
      new RegExp(`severity:\\s*${severityNumber}\\s*:?\\s*${expectedLabel}`, 'i').test(text) ||
      new RegExp(`\\(${severityNumber}\\s*${expectedLabel}\\)`, 'i').test(text) ||
      new RegExp(`\\(${expectedLabel}\\s*${severityNumber}\\)`, 'i').test(text)
    );
    if (!hasMatchingSeverityLabel) {
      dimensionSeverityWarnings.push(`Dimension ${dimension} is missing a matching severity number/label`);
    }
  }
  const safety = normalized.case_management?.safety_planning || {};
  const missingSafetyFields = [
    !String(safety.additional_safety_planning_needed || '').trim() ? 'Is additional safety planning needed?' : '',
    !String(safety.why_or_why_not || '').trim() ? 'Why or why not?' : ''
  ].filter(Boolean);
  return {
    characterCount: response.length,
    parsedJson: true,
    topLevelKeys: Object.keys(parsed),
    functioningCategories: ASAM_FUNCTIONING_ITEMS.length - missingFunctioning.length,
    missingFunctioning,
    invalidFunctioning,
    dimensionsPresent: 6 - missingDimensions.length,
    missingDimensions,
    dimensionSeverityWarnings,
    missingSafetyFields,
    warnings: [
      ...(missingFunctioning.length ? [`Missing Functioning scores: ${missingFunctioning.join(', ')}`] : []),
      ...(invalidFunctioning.length ? [`Multiple Functioning scores selected: ${invalidFunctioning.join(', ')}`] : []),
      ...(missingDimensions.length ? [`Missing ASAM dimensions: ${missingDimensions.join(', ')}`] : []),
      ...dimensionSeverityWarnings,
      ...(missingSafetyFields.length ? [`Missing safety planning fields: ${missingSafetyFields.join(', ')}`] : [])
    ],
    normalized
  };
}
function assertAsamResponseComplete(summary) {
  const blocking = [
    ...(summary.missingFunctioning || []).map(item => `Functioning: ${item}`),
    ...(summary.invalidFunctioning || []).map(item => `Functioning has multiple scores: ${item}`),
    ...(summary.missingDimensions || []),
    ...(summary.dimensionSeverityWarnings || []),
    ...(summary.missingSafetyFields || [])
  ];
  if (blocking.length) {
    throw new Error(`Part 3 response is incomplete. Fix these before filling:\n${blocking.join('\n')}`);
  }
}
async function saveAsamResponse() {
  await chrome.storage.local.set({ [STORAGE_KEYS.asamResponse]: $('asamResp')?.value || '' });
}
function getDiagnosticsPath(obj, path) {
  return String(path || '').split('.').reduce((cur, part) => cur == null ? undefined : cur[part], obj);
}
function firstDiagnosticsValue(root, paths) {
  for (const path of paths || []) {
    const value = getDiagnosticsPath(root, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}
function diagnosticsText(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(diagnosticsText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    if ('selected' in value && Object.keys(value).length === 1) return '';
    return Object.entries(value)
      .filter(([key]) => !['selected', 'checked'].includes(key))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, item]) => diagnosticsText(item))
      .filter(Boolean)
      .join('\n\n');
  }
  return String(value || '').trim();
}
function diagnosticsSelected(value) {
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('selected' in value) return diagnosticsSelected(value.selected);
    if ('checked' in value) return diagnosticsSelected(value.checked);
    if ('value' in value) return diagnosticsSelected(value.value);
    return Boolean(diagnosticsText(value));
  }
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return false;
  if (['true', 'yes', 'checked', 'selected', 'x', '1'].includes(text)) return true;
  if (['false', 'no', 'unchecked', 'not selected', '0'].includes(text)) return false;
  return false;
}
function normalizeDiagnosticsResponseForFill(parsed) {
  const root = firstAsamObject(parsed?.diagnostics, parsed?.part4, parsed?.diagnostics_part4, parsed) || {};
  const normalized = {
    screening_results: {},
    assessment_summary: {},
    clinical_recommendations: {},
    dsm_v: {},
    level_of_care: {}
  };
  DIAGNOSTICS_SCREENING_FIELDS.forEach(field => {
    normalized.screening_results[field.key] = diagnosticsText(firstDiagnosticsValue(root, [
      `screening_results.${field.key}`,
      `screening_results.${field.aliases[0]}`,
      `screening_results.${field.aliases[1]}`,
      field.key,
      field.aliases[0],
      field.aliases[1]
    ]));
  });
  normalized.assessment_summary.narrative = diagnosticsText(firstDiagnosticsValue(root, [
    'assessment_summary.narrative',
    'assessment_summary.text',
    'assessment_summary.summary',
    'assessment_summary',
    'narrative'
  ]));
  const recommendations = firstAsamObject(root.clinical_recommendations, root.recommendations, {}) || {};
  DIAGNOSTICS_RECOMMENDATION_ITEMS.forEach(item => {
    const raw = getObjectValueByAliases(recommendations, [item.key, item.label]) ?? firstDiagnosticsValue(root, [
      `clinical_recommendations.${item.key}`,
      `recommendations.${item.key}`,
      item.key
    ]);
    if (item.key === 'other_services') {
      const servicesSource = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw.services ?? raw.service_list ?? raw.text ?? raw.rationale)
        : (typeof raw === 'string' ? raw : '');
      const services = diagnosticsText(servicesSource);
      normalized.clinical_recommendations.other_services = {
        selected: diagnosticsSelected(raw) || Boolean(services),
        services,
        rationale: diagnosticsText(raw?.rationale || '')
      };
      return;
    }
    normalized.clinical_recommendations[item.key] = {
      selected: diagnosticsSelected(raw),
      rationale: diagnosticsText(raw?.rationale || raw?.reason || '')
    };
  });
  const dsmValue = firstDiagnosticsValue(root, [
    'dsm_v.text',
    'dsm_v.diagnoses',
    'dsm_v.sud_diagnoses_only',
    'dsm_v',
    'dsmv',
    'diagnoses'
  ]);
  normalized.dsm_v.text = diagnosticsText(dsmValue);
  const loc = firstAsamObject(root.level_of_care, root.levelOfCare, {}) || {};
  normalized.level_of_care.recommended_level = diagnosticsText(loc.recommended_level ?? loc.level ?? loc.level_of_care ?? root.level_of_care_recommended);
  normalized.level_of_care.rationale = diagnosticsText(loc.rationale ?? loc.asam_rationale ?? loc.clinical_rationale ?? loc.why_recommended);
  normalized.level_of_care.recommended_level_text = [
    normalized.level_of_care.recommended_level,
    normalized.level_of_care.rationale
  ].filter(Boolean).join('\n\n');
  normalized.level_of_care.estimated_length_of_time_at_this_level = diagnosticsText(
    loc.estimated_length_of_time_at_this_level ?? loc.estimated_length ?? loc.length_of_time ?? root.estimated_length_of_time_at_this_level
  );
  normalized.level_of_care.estimated_date_of_discharge = diagnosticsText(
    loc.estimated_date_of_discharge ?? loc.estimated_discharge ?? loc.discharge_date ?? root.estimated_date_of_discharge
  );
  return normalized;
}
function validateDiagnosticsResponse() {
  const response = $('diagnosticsResp')?.value.trim() || '';
  if (!response) throw new Error('Paste the Diagnostics Part 4 response first.');
  const parsed = parseJsonWithDiagnostic(response, 'Diagnostics Part 4 response');
  const normalized = normalizeDiagnosticsResponseForFill(parsed);
  const missingScreening = DIAGNOSTICS_SCREENING_FIELDS
    .filter(field => !String(normalized.screening_results[field.key] || '').trim())
    .map(field => field.label);
  const selectedRecommendations = DIAGNOSTICS_RECOMMENDATION_ITEMS
    .filter(item => normalized.clinical_recommendations[item.key]?.selected === true)
    .map(item => item.label);
  const missingRequiredText = [
    !normalized.assessment_summary.narrative ? 'Assessment Summary narrative' : '',
    !normalized.dsm_v.text ? 'DSM V' : '',
    !normalized.level_of_care.recommended_level_text ? 'Level of Care Recommended' : '',
    !normalized.level_of_care.estimated_length_of_time_at_this_level ? 'Estimated length of time at this level' : '',
    !normalized.level_of_care.estimated_date_of_discharge ? 'Estimated date of discharge' : ''
  ].filter(Boolean);
  const other = normalized.clinical_recommendations.other_services || {};
  const warnings = [
    ...(missingScreening.length ? [`Missing screening values: ${missingScreening.join(', ')}`] : []),
    ...(missingRequiredText.length ? [`Missing required Part 4 text fields: ${missingRequiredText.join(', ')}`] : []),
    ...(!selectedRecommendations.length ? ['No clinical recommendations are selected.'] : []),
    ...(other.selected && !String(other.services || '').trim() ? ['Other Services is selected but no services text is present.'] : [])
  ];
  return {
    characterCount: response.length,
    parsedJson: true,
    topLevelKeys: Object.keys(parsed),
    selectedRecommendations,
    missingScreening,
    missingRequiredText,
    warnings,
    normalized
  };
}
function assertDiagnosticsResponseComplete(summary) {
  const blocking = [
    ...(summary.missingScreening || []).map(item => `Screening: ${item}`),
    ...(summary.missingRequiredText || [])
  ];
  if (blocking.length) {
    throw blockingDiagnostic({
      source: 'BastionGPT response',
      stage: 'schema_validation',
      category: 'missing_required_part4_data',
      workflow: 'Diagnostics Part 4',
      message: 'Diagnostics Part 4 response parsed as JSON, but required Part 4 data is missing. Nothing was filled.',
      details: blocking,
      nextAction: 'Regenerate or edit the BastionGPT response so the missing Screening, Assessment Summary, DSM V, and Level of Care fields are present.'
    });
  }
}

function normalizeTreatmentHeading(value) {
  return String(value || '')
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*$/, '')
    .trim()
    .toLowerCase();
}
function treatmentHeadingInfo(line) {
  const normalized = normalizeTreatmentHeading(line);
  const problem = normalized.match(/^problem\s*#\s*([1-3])$/);
  if (problem) return { key: 'problem', number: Number(problem[1]) };
  if (normalized === 'strengths') return { key: 'strengths' };
  if (normalized === 'risk factors') return { key: 'risk_factors' };
  if (normalized === 'problem statement') return { key: 'problem_statement' };
  const goal = normalized.match(/^goal(?:\s*\(([^)]+)\))?$/);
  if (goal) return { key: 'goal', domain: goal[1] || '' };
  if (normalized === 'objectives') return { key: 'objectives' };
  if (normalized === 'target date') return { key: 'target_date' };
  if (normalized === 'estimated length of treatment') return { key: 'estimated_length_of_treatment' };
  if (normalized === 'completion date') return { key: 'completion_date' };
  if (normalized === 'therapeutic interventions') return { key: 'therapeutic_interventions' };
  if (/^review\s*\/?\s*comments$/.test(normalized)) return { key: 'review_comments' };
  if (normalized === 'safety planning') return { key: 'safety_planning' };
  if (normalized === 'next review date' || normalized === 'next review on or before') return { key: 'next_review_date' };
  return null;
}
function cleanTreatmentSectionText(lines) {
  return (lines || [])
    .join('\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n{3,}/g, '\n\n');
}
function parseTreatmentNumberedList(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  const matches = [...text.matchAll(/(?:^|\n)\s*(\d+)\.\s*([\s\S]*?)(?=(?:\n\s*\d+\.\s*)|$)/g)];
  if (!matches.length) {
    return text.split(/\n+/).map(item => item.replace(/^\s*(?:\d+[.)]|[-*•▪◦])\s*/, '').trim()).filter(Boolean);
  }
  return matches.map(match => match[2].replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}
function treatmentLinesText(items) {
  return (items || [])
    .map(item => String(item || '').replace(/^\s*(?:\d+[.)]|[-*•▪◦])\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}
function treatmentDateParts(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth(), day: value.getDate() };
  }
  const text = String(value || '').trim();
  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
  let year;
  let month;
  let day;
  if (numeric) {
    year = Number(numeric[3]);
    month = Number(numeric[1]) - 1;
    day = Number(numeric[2]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]) - 1;
    day = Number(iso[3]);
  } else if (text) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  }
  if (Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)) {
    const verified = new Date(year, month, day, 12);
    if (verified.getFullYear() === year && verified.getMonth() === month && verified.getDate() === day) {
      return { year, month, day };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}
function treatmentTargetDays(value) {
  const match = String(value || '')
    .replace(/[–—]/g, '-')
    .match(/\b(\d+)\s*(?:(?:-|to)\s*(\d+)\s*)?days?\b/i);
  if (!match) return null;
  return Number(match[2] || match[1]);
}
function treatmentCompletionMonthYear(targetDate, baseDateValue = '') {
  const days = treatmentTargetDays(targetDate);
  if (!Number.isFinite(days)) return '';
  const base = treatmentDateParts(baseDateValue);
  const completion = new Date(base.year, base.month, base.day + days, 12);
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][completion.getMonth()];
  return `${month} ${completion.getFullYear()}`;
}
function applyTreatmentCompletionDates(plan, baseDateValue = '') {
  (plan?.problems || []).forEach(problem => {
    const calculated = treatmentCompletionMonthYear(
      problem.target_date || problem.estimated_length_of_treatment,
      baseDateValue
    );
    if (calculated) problem.completion_date = calculated;
  });
  return plan;
}
function treatmentSectionsFromLines(lines) {
  const headings = [];
  (lines || []).forEach((line, index) => {
    const info = treatmentHeadingInfo(line);
    if (info) headings.push({ ...info, index });
  });
  const values = {};
  headings.forEach((heading, index) => {
    if (heading.key === 'problem') return;
    const nextIndex = headings[index + 1]?.index ?? lines.length;
    values[heading.key] = cleanTreatmentSectionText(lines.slice(heading.index + 1, nextIndex));
    if (heading.domain) values.goal_domain = heading.domain;
  });
  return values;
}
function normalizeTreatmentProblem(problem = {}, number = 1, scenarioId = '') {
  const objectives = Array.isArray(problem.objectives)
    ? problem.objectives.map(item => String(item || '').replace(/^\s*(?:\d+[.)]|[-*•▪◦])\s*/, '').trim()).filter(Boolean)
    : parseTreatmentNumberedList(problem.objectives || problem.objectives_text || '');
  const interventions = Array.isArray(problem.therapeutic_interventions)
    ? problem.therapeutic_interventions.map(item => String(item || '').replace(/^\s*(?:\d+[.)]|[-*•▪◦])\s*/, '').trim()).filter(Boolean)
    : parseTreatmentNumberedList(problem.therapeutic_interventions || problem.therapeutic_interventions_text || '');
  const targetDate = String(problem.target_date || problem.estimated_length_of_treatment || '').trim();
  return {
    number,
    problem_statement: String(problem.problem_statement || '').trim(),
    goal_domain: String(problem.goal_domain || '').trim(),
    goal: String(problem.goal || '').trim(),
    objectives,
    objectives_text: treatmentLinesText(objectives),
    target_date: targetDate,
    estimated_length_of_treatment: String(problem.estimated_length_of_treatment || targetDate).trim(),
    completion_date: String(problem.completion_date || '').trim(),
    therapeutic_interventions: interventions,
    therapeutic_interventions_text: treatmentLinesText(interventions),
    review_comments: scenarioId === 'higher_level_asam_3_7' ? String(problem.review_comments || '').trim() : ''
  };
}
function normalizeTreatmentPlanObject(value, scenarioId = '') {
  const root = value?.treatment_plan || value || {};
  const problems = Array.isArray(root.problems) ? root.problems : [root.problem_1, root.problem_2, root.problem_3].filter(Boolean);
  const normalizedScenario = String(scenarioId || root.scenario || '').trim();
  const plan = {
    scenario: normalizedScenario,
    assessment_date: String(root.assessment_date || '').trim(),
    date_of_service_plan: String(root.date_of_service_plan || '').trim(),
    strengths: String(root.strengths || '').trim(),
    risk_factors: String(root.risk_factors || '').trim(),
    problems: problems.map((problem, index) => normalizeTreatmentProblem(problem, index + 1, normalizedScenario)),
    safety_planning: String(root.safety_planning || '').trim(),
    next_review_date: String(root.next_review_date || '').trim()
  };
  applyTreatmentCompletionDates(plan, plan.date_of_service_plan || plan.assessment_date);
  return {
    treatment_plan: plan
  };
}
function parseTreatmentPlanText(raw, scenarioId = '') {
  const text = String(raw || '').replace(/\r\n?/g, '\n').trim();
  if (!text) throw blockingDiagnostic({
    source: 'Treatment Plan response',
    stage: 'parse',
    category: 'missing_response',
    workflow: 'Treatment Plan',
    message: 'Paste Rose\'s Treatment Plan output before validating.',
    nextAction: 'Run the selected Treatment Plan prompt, paste the complete output, and validate again.'
  });
  if (/^\s*\{/.test(text)) {
    return normalizeTreatmentPlanObject(parseJsonWithDiagnostic(text, 'Treatment Plan response'), scenarioId);
  }
  const lines = text.split('\n');
  const problemHeadings = lines
    .map((line, index) => ({ index, info: treatmentHeadingInfo(line) }))
    .filter(item => item.info?.key === 'problem');
  const firstProblemIndex = problemHeadings[0]?.index ?? lines.length;
  const preamble = treatmentSectionsFromLines(lines.slice(0, firstProblemIndex));
  const problems = problemHeadings.map((heading, index) => {
    const start = heading.index + 1;
    const end = problemHeadings[index + 1]?.index ?? lines.length;
    const block = lines.slice(start, end);
    const tailIndex = block.findIndex(line => ['safety_planning', 'next_review_date'].includes(treatmentHeadingInfo(line)?.key));
    const sections = treatmentSectionsFromLines(tailIndex >= 0 ? block.slice(0, tailIndex) : block);
    return normalizeTreatmentProblem(sections, heading.info.number, scenarioId);
  });
  const safetyIndex = lines.findIndex(line => treatmentHeadingInfo(line)?.key === 'safety_planning');
  const nextReviewIndex = lines.findIndex(line => treatmentHeadingInfo(line)?.key === 'next_review_date');
  const tailSections = treatmentSectionsFromLines(lines.slice(Math.max(0, safetyIndex >= 0 ? safetyIndex : nextReviewIndex)));
  return normalizeTreatmentPlanObject({
    scenario: scenarioId,
    strengths: preamble.strengths || '',
    risk_factors: preamble.risk_factors || '',
    problems,
    safety_planning: tailSections.safety_planning || '',
    next_review_date: tailSections.next_review_date || ''
  }, scenarioId);
}
function treatmentScenarioWarnings(plan, scenarioId) {
  const warnings = [];
  const problems = plan?.problems || [];
  const normalizeGoalDomain = (value) => String(value || '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
  const warnGoalDomains = (expectedDomains) => {
    problems.forEach((problem, index) => {
      const expected = expectedDomains[index];
      const actual = normalizeGoalDomain(problem.goal_domain);
      if (expected && actual !== normalizeGoalDomain(expected)) {
        warnings.push(`Problem ${problem.number} should use Goal (${expected}); parsed ${problem.goal_domain ? `Goal (${problem.goal_domain})` : 'an unlabeled Goal'}.`);
      }
    });
  };
  const warnNextReview = (pattern, requirement) => {
    if (!pattern.test(String(plan?.next_review_date || ''))) {
      warnings.push(`Next Review Date should ${requirement}.`);
    }
  };
  const allText = [
    plan?.strengths,
    plan?.risk_factors,
    ...problems.flatMap(problem => [
      problem.problem_statement,
      problem.goal,
      ...problem.objectives,
      ...problem.therapeutic_interventions
    ])
  ].join(' ').toLowerCase();
  const objectiveText = problems.flatMap(problem => problem.objectives || []).join(' ').toLowerCase();
  const sudForbiddenLanguage = /\b(30-day|transition|discharge|continuity of care period|stabilization period)\b/i;
  if (scenarioId === 'sud_outpatient') {
    warnGoalDomains(['Recovery', 'Life Skills', 'Emotional Regulation']);
    problems.forEach(problem => {
      if (!/^90\s*days?$/i.test(problem.target_date)) warnings.push(`Problem ${problem.number} Target Date should be 90 days for the SUD outpatient prompt.`);
      if (!problem.completion_date) warnings.push(`Problem ${problem.number} is missing Completion Date.`);
    });
    warnNextReview(/\b90\s*days?\b/i, 'be 90 days from treatment plan initiation for the SUD outpatient prompt');
    if (sudForbiddenLanguage.test(allText)) warnings.push('The SUD outpatient response contains language Rose marked forbidden.');
    if (/\b(at least(?: one| two)?|minimum of|80% of sessions|three coping skills|once weekly|twice weekly|per week|per month)\b/i.test(objectiveText)) {
      warnings.push('The SUD outpatient objectives contain quota or attendance language Rose marked forbidden.');
    }
  }
  if (scenarioId === 'sud_detox_first') {
    warnGoalDomains(['Detox', 'Recovery', 'Life Skills']);
    if (!/7\s*[-–]\s*10\s*days/i.test(problems[0]?.target_date || '')) warnings.push('Problem 1 should use a 7-10 day detox timeframe.');
    problems.slice(1).forEach(problem => {
      if (!/^90\s*days?$/i.test(problem.target_date)) warnings.push(`Problem ${problem.number} should use a 90-day treatment timeframe.`);
    });
    warnNextReview(/\b180\s*days?\b/i, 'be 180 days from treatment plan initiation for the detox-first prompt');
    if (sudForbiddenLanguage.test(allText)) warnings.push('The detox-first response contains language Rose marked forbidden.');
    if (!/medically supervised detoxification|withdrawal risk/i.test(problems[0]?.problem_statement || '')) {
      warnings.push('Problem 1 should explicitly support medically supervised detoxification due to withdrawal risk.');
    }
  }
  if (scenarioId === 'higher_level_asam_3_7') {
    warnGoalDomains(['Stabilization', 'Withdrawal Management', 'Psychiatric Stabilization']);
    problems.forEach(problem => {
      if (!/(5\s*[-–]\s*7|7\s*[-–]\s*10|10\s*[-–]\s*14)\s*days/i.test(problem.target_date)) {
        warnings.push(`Problem ${problem.number} Target Date should be 5-7, 7-10, or 10-14 days for ASAM 3.7.`);
      }
    });
    if (!/medically managed residential stabilization|asam\s*3\.7/i.test(allText)) warnings.push('The higher-level response does not clearly name Medically Managed Residential Stabilization (ASAM 3.7).');
    warnNextReview(/\bfollowing stabilization\b|\btransition to appropriate ongoing level of care\b/i, 'occur following stabilization or transition to the appropriate ongoing level of care');
  }
  if (scenarioId === 'non_sud_refer_out') {
    problems.forEach(problem => {
      if (!/^30\s*days?$/i.test(problem.target_date)) warnings.push(`Problem ${problem.number} Target Date should be 30 days for referral out.`);
      if (!problem.completion_date) warnings.push(`Problem ${problem.number} is missing Completion Date.`);
    });
    warnNextReview(/\b30\s*days?\b/i, 'be 30 days from treatment plan initiation for the non-SUD referral prompt');
    if (/\b(relapse prevention|recovery programming|sobriety maintenance|continued sud treatment|cravings|substance recovery goals)\b/i.test(allText)) {
      warnings.push('The non-SUD referral response contains recovery language Rose marked forbidden unless clearly supported by the assessment.');
    }
    if (/\b(at least|minimum of|one per week|twice weekly|weekly|monthly|per week|per month|identify two resources|identify three coping skills|document progress|document triggers|complete a self-assessment|complete an evaluation|80% of sessions)\b/i.test(objectiveText)) {
      warnings.push('The non-SUD referral objectives contain quota, attendance, or homework language Rose marked forbidden.');
    }
  }
  return warnings;
}
function validateTreatmentResponse() {
  const scenarioId = selectedTreatmentPrompt()?.id || '';
  const normalized = parseTreatmentPlanText($('treatmentResp')?.value || '', scenarioId);
  const plan = normalized.treatment_plan;
  const errors = [];
  const warnings = [];
  if (!plan.strengths) errors.push('Strengths is missing.');
  if (!plan.risk_factors) errors.push('Risk Factors is missing.');
  if (plan.problems.length !== 3) errors.push(`Expected 3 problems, parsed ${plan.problems.length}.`);
  plan.problems.forEach((problem, index) => {
    const number = index + 1;
    if (!problem.problem_statement) errors.push(`Problem ${number} statement is missing.`);
    if (!problem.goal) errors.push(`Problem ${number} goal is missing.`);
    if (problem.objectives.length < 2 || problem.objectives.length > 3) warnings.push(`Problem ${number} should have 2-3 objectives on separate lines; parsed ${problem.objectives.length}.`);
    if (problem.therapeutic_interventions.length < 2 || problem.therapeutic_interventions.length > 3) warnings.push(`Problem ${number} should have 2-3 interventions on separate lines; parsed ${problem.therapeutic_interventions.length}.`);
    if (!problem.target_date) warnings.push(`Problem ${number} Target Date or Estimated Length of Treatment is missing.`);
    if (scenarioId === 'higher_level_asam_3_7' && !problem.review_comments) warnings.push(`Problem ${number} Review/Comments is required for the higher-level-of-care scenario.`);
  });
  if (!plan.safety_planning) errors.push('Safety Planning is missing.');
  if (!plan.next_review_date) errors.push('Next Review Date is missing.');
  warnings.push(...treatmentScenarioWarnings(plan, scenarioId));
  if (errors.length) throw blockingDiagnostic({
    source: 'Treatment Plan response',
    stage: 'validation',
    category: 'incomplete_treatment_plan',
    workflow: 'Treatment Plan',
    message: 'The Treatment Plan response is incomplete and was not approved for fill.',
    details: errors.join('\n'),
    nextAction: 'Regenerate or repair the missing sections, then validate again before filling.'
  });
  return {
    ok: !warnings.length,
    scenario: scenarioId,
    parsedProblems: plan.problems.length,
    objectiveCounts: plan.problems.map(problem => problem.objectives.length),
    interventionCounts: plan.problems.map(problem => problem.therapeutic_interventions.length),
    warnings,
    normalized
  };
}
async function saveTreatmentResponse() {
  await chrome.storage.local.set({ [STORAGE_KEYS.treatmentResponse]: $('treatmentResp')?.value || '' });
}
async function prepareTreatmentResponseForFill() {
  const validation = validateTreatmentResponse();
  const context = await runInActiveTab(pageExtractTreatmentPlanContext, []);
  if (context?.error) throw new Error(context.error);
  const normalized = JSON.parse(JSON.stringify(validation.normalized));
  const plan = normalized.treatment_plan;
  if (!plan.assessment_date && context.dateOfServicePlan) {
    plan.assessment_date = context.dateOfServicePlan;
  }
  if (!plan.date_of_service_plan && context.dateOfServicePlan) {
    plan.date_of_service_plan = context.dateOfServicePlan;
  }
  applyTreatmentCompletionDates(
    plan,
    context.dateOfServicePlan || plan.date_of_service_plan || plan.assessment_date
  );
  const comparableReviewValue = (value) => String(value || '').toLowerCase().replace(/[.\s]+$/g, '').trim();
  const nextReviewMismatch = context.nextReviewDate && plan.next_review_date &&
    comparableReviewValue(context.nextReviewDate) !== comparableReviewValue(plan.next_review_date);
  return {
    validation: {
      ...validation,
      warnings: [
        ...(validation.warnings || []),
        ...(!plan.assessment_date ? ['Assessment Date could not be copied because Date of Service Plan was not found on the active page.'] : []),
        ...(context.assessmentDate && context.dateOfServicePlan && context.assessmentDate !== context.dateOfServicePlan
          ? [`Assessment Date (${context.assessmentDate}) differs from Date of Service Plan (${context.dateOfServicePlan}); Rose requires them to match.`]
          : []),
        ...(nextReviewMismatch
          ? [`The form's read-only Next Review value is "${context.nextReviewDate}", while the response requires "${plan.next_review_date}". The extension left the form value unchanged.`]
          : [])
      ]
    },
    normalized,
    context
  };
}
function treatmentTraceEntries() {
  return (traceLog || []).filter(entry => entry?.mode === 'treatment' || entry?.workflowMode === 'treatment').slice(-10);
}
async function buildTreatmentSupportBundle() {
  const bundle = {
    event: 'treatment_plan_support_bundle',
    timestamp: new Date().toISOString(),
    extensionVersion: extensionVersion(),
    workflowVersion: workflowConfig?.version || '',
    treatmentPromptVersion: treatmentConfig?.version || '',
    selectedScenario: selectedTreatmentPrompt()?.id || '',
    selectedPromptTitle: selectedTreatmentPrompt()?.title || '',
    activeTab: await activeTabForN8n(),
    config: {
      ...workflowModeSummary('treatment'),
      runtimeFieldMap: buildTreatmentRuntimeConfig().fieldMap
    },
    response: null,
    context: null,
    scan: null,
    discovery: null,
    recentTreatmentTrace: treatmentTraceEntries(),
    warnings: []
  };
  try {
    const validation = validateTreatmentResponse();
    bundle.response = {
      ok: validation.ok,
      parsedProblems: validation.parsedProblems,
      objectiveCounts: validation.objectiveCounts,
      interventionCounts: validation.interventionCounts,
      warnings: validation.warnings,
      normalized: validation.normalized
    };
  } catch (err) {
    bundle.response = {
      ok: false,
      diagnostic: ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'response_validation' }).diagnostic,
      rawResponse: $('treatmentResp')?.value || ''
    };
  }
  try {
    bundle.context = await runInActiveTab(pageExtractTreatmentPlanContext, []);
  } catch (err) {
    bundle.context = ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'page_context' }).diagnostic;
  }
  try {
    bundle.scan = await runInActiveTab(pageScan, [buildTreatmentRuntimeConfig()]);
  } catch (err) {
    bundle.scan = ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'page_scan' }).diagnostic;
  }
  try {
    bundle.discovery = await runInActiveTab(pageDiscover, [{
      pathPrefix: 'treatment_plan',
      includeHiddenControls: true,
      capturePageSource: true,
      expandInteractiveSections: true
    }]);
  } catch (err) {
    bundle.discovery = ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'page_discovery' }).diagnostic;
  }
  bundle.warnings = [
    ...(bundle.response?.warnings || []),
    ...(bundle.context?.warnings || []),
    ...((bundle.scan?.found && bundle.scan?.found < buildTreatmentRuntimeConfig().fieldMap.length)
      ? [`The active page exposed ${bundle.scan.found} controls, fewer than the ${buildTreatmentRuntimeConfig().fieldMap.length} Treatment Plan fields the extension can populate.`]
      : [])
  ];
  treatmentSupportBundle = bundle;
  try {
    const storable = bundle.discovery?.pageSource?.html
      ? {
          ...bundle,
          discovery: {
            ...bundle.discovery,
            pageSource: { ...bundle.discovery.pageSource, html: '', htmlOmittedFromStorage: true }
          }
        }
      : bundle;
    await chrome.storage.local.set({ [STORAGE_KEYS.treatmentSupportBundle]: storable });
  } catch {
    await chrome.storage.local.remove([STORAGE_KEYS.treatmentSupportBundle]);
  }
  return bundle;
}
function annotateDiagnosticsFillResult(result, config) {
  if (!result || typeof result !== 'object') return result;
  const annotations = [];
  if (result.error) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'fill_runtime',
      category: 'form_write_error',
      blocking: true,
      workflow: 'Diagnostics Part 4',
      message: 'The Diagnostics Part 4 JSON parsed successfully, but the extension hit an error while scanning or writing the active ReliaTrax page.',
      details: result.error,
      nextAction: 'Use Scan active page, confirm the active tab is the Diagnostics / Clinical Impressions page, and copy the troubleshooting trace.'
    });
  }
  if (config?.expectedFieldCount && result.found !== undefined && result.found !== config.expectedFieldCount) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'field_scan',
      category: 'field_count_mismatch',
      blocking: false,
      workflow: 'Diagnostics Part 4',
      message: `The active page has ${result.found} fillable controls, but the loaded Part 4 map expects ${config.expectedFieldCount}.`,
      details: result.warnings || [],
      nextAction: 'Open the correct Part 4 page or refresh the page/map before filling a live record.'
    });
  }
  if (result.found === 0) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'field_scan',
      category: 'no_fillable_controls_found',
      blocking: true,
      workflow: 'Diagnostics Part 4',
      message: 'The active page did not expose any fillable ReliaTrax controls to the extension.',
      details: {
        selector: result.selector || config?.selector || '',
        activePage: redactUrlForReport(result.url || '')
      },
      nextAction: 'Make sure the active tab is the loaded Diagnostics / Clinical Impressions Part 4 form, then click Scan active page.'
    });
  }
  if (Array.isArray(result.missing) && result.missing.length) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'field_resolution',
      category: 'mapped_fields_missing',
      blocking: true,
      workflow: 'Diagnostics Part 4',
      message: `${result.missing.length} mapped Part 4 field${result.missing.length === 1 ? '' : 's'} could not be found on the active page.`,
      details: result.missing,
      nextAction: 'Run Discovery and Mapping on the active Part 4 page so the field map can be updated.'
    });
  }
  if (Array.isArray(result.missingMappedDataQnFieldIds) && result.missingMappedDataQnFieldIds.length) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'field_scan',
      category: 'mapped_field_ids_missing',
      blocking: true,
      workflow: 'Diagnostics Part 4',
      message: `${result.missingMappedDataQnFieldIds.length} mapped Part 4 field id${result.missingMappedDataQnFieldIds.length === 1 ? '' : 's'} were not present on the active page.`,
      details: result.missingMappedDataQnFieldIds,
      nextAction: 'Confirm the active tab is the Diagnostics / Clinical Impressions Part 4 page. If it is, run Discovery and Mapping so the field map can be refreshed.'
    });
  }
  if (result.checkboxWriteFailures) {
    annotations.push({
      source: 'ReliaTrax form fields',
      stage: 'field_write',
      category: 'checkbox_write_failed',
      blocking: false,
      workflow: 'Diagnostics Part 4',
      message: `${result.checkboxWriteFailures} Part 4 checkbox write${result.checkboxWriteFailures === 1 ? '' : 's'} did not stick after the extension attempted to set them.`,
      details: (result.trace || []).filter(item => item.checkboxSetSucceeded === false),
      nextAction: 'Review the highlighted fields and trace log; the ReliaTrax page may have disabled controls or changed checkbox behavior.'
    });
  }
  if (!annotations.length && result.event === 'fill' && !result.dryRun && !Number(result.written || 0)) {
    annotations.push({
      source: 'Extension runtime',
      stage: 'fill_summary',
      category: 'no_fields_written',
      blocking: true,
      workflow: 'Diagnostics Part 4',
      message: 'We don\'t know exactly what went wrong, but the fill command finished without writing any Part 4 fields.',
      details: {
        found: result.found,
        expected: result.expected,
        skipped: result.skipped,
        missingCount: result.missing?.length || 0,
        warningCount: result.warnings?.length || 0
      },
      nextAction: 'Run Part 4 preflight and copy the troubleshooting report before trying again.'
    });
  }
  return annotations.length ? { ...result, diagnosticAnnotations: annotations } : result;
}
function compactDiagnosticForReport(diagnostic) {
  if (!diagnostic) return null;
  return {
    ok: diagnostic.ok === true,
    source: diagnostic.source || '',
    stage: diagnostic.stage || '',
    category: diagnostic.category || '',
    blocking: Boolean(diagnostic.blocking),
    workflow: diagnostic.workflow || '',
    message: diagnostic.message || '',
    parserMessage: diagnostic.parserMessage || '',
    likelyCause: diagnostic.likelyCause || '',
    line: diagnostic.line,
    column: diagnostic.column,
    chromeMessage: diagnostic.chromeMessage || '',
    activeTab: diagnostic.activeTab || undefined,
    details: diagnostic.details || undefined,
    nextAction: diagnostic.nextAction || ''
  };
}
function summarizeDiagnosticsResponseForReport() {
  const response = $('diagnosticsResp')?.value || '';
  const trimmed = response.trim();
  const base = {
    present: Boolean(trimmed),
    characterCount: response.length,
    nonBlankLineCount: response.split(/\r?\n/).filter(line => line.trim()).length,
    startsWithJsonObject: trimmed.startsWith('{'),
    startsWithCodeFence: /^```/.test(trimmed),
    hasCodeFence: /```/.test(trimmed)
  };
  if (!trimmed) {
    return {
      ...base,
      ok: false,
      diagnostic: {
        category: 'missing_response',
        message: 'No Diagnostics Part 4 response is pasted.',
        nextAction: 'Paste the BastionGPT Part 4 JSON response before filling.'
      }
    };
  }
  try {
    const summary = validateDiagnosticsResponse();
    return {
      ...base,
      ok: !summary.warnings.length,
      parsedJson: true,
      topLevelKeys: summary.topLevelKeys,
      selectedRecommendations: summary.selectedRecommendations,
      missingScreening: summary.missingScreening,
      missingRequiredText: summary.missingRequiredText,
      warnings: summary.warnings
    };
  } catch (err) {
    const diagnostic = compactDiagnosticForReport(ensureDiagnostic(err, {
      workflow: 'Diagnostics Part 4',
      stage: 'response_validation',
      nextAction: 'Regenerate or repair the BastionGPT response so it is one valid JSON object.'
    }).diagnostic);
    if (diagnostic) delete diagnostic.details;
    return {
      ...base,
      ok: false,
      parsedJson: false,
      diagnostic
    };
  }
}
function sanitizeDiagnosticsResultForReport(result) {
  if (!result || typeof result !== 'object') return result || null;
  return {
    event: result.event || '',
    timestamp: result.timestamp || '',
    mode: result.mode || 'diagnostics',
    title: result.title || '',
    url: redactUrlForReport(result.url || ''),
    found: result.found,
    expected: result.expected,
    mappedFieldCount: result.mappedFieldCount,
    mappedDataQnFieldIdsFound: result.mappedDataQnFieldIdsFound,
    missingMappedDataQnFieldIds: result.missingMappedDataQnFieldIds,
    dryRun: result.dryRun,
    written: result.written,
    responseWritten: result.responseWritten,
    defaultWritten: result.defaultWritten,
    checkboxWritten: result.checkboxWritten,
    checkboxTrueWritten: result.checkboxTrueWritten,
    checkboxFalseWritten: result.checkboxFalseWritten,
    checkboxWriteFailures: result.checkboxWriteFailures,
    skipped: result.skipped,
    missing: Array.isArray(result.missing)
      ? result.missing.map(item => ({
          fillIndex: item.fillIndex,
          dataQnFieldId: item.dataQnFieldId,
          label: item.label,
          section: item.section,
          resolutionStrategy: item.resolutionStrategy,
          paths: item.paths
        }))
      : undefined,
    warnings: result.warnings || [],
    diagnosticAnnotations: result.diagnosticAnnotations || []
  };
}
function latestDiagnosticsTraceSummary() {
  const latest = [...(traceLog || [])].reverse().find(entry => entry?.mode === 'diagnostics' || entry?.event === 'diagnostics_part3_context');
  return sanitizeDiagnosticsResultForReport(latest);
}
async function buildDiagnosticsTroubleshootingReport({ scanActivePage = true } = {}) {
  const report = {
    event: 'diagnostics_part4_troubleshooting_report',
    timestamp: new Date().toISOString(),
    activeMode,
    statusText: $('status')?.textContent || '',
    config: configSummary(),
    response: summarizeDiagnosticsResponseForReport(),
    activeTab: null,
    activePageScan: null,
    lastDiagnosticsTrace: latestDiagnosticsTraceSummary(),
    whatToSend: [
      'This copied report.',
      'A screenshot of the Diagnostics / Clinical Impressions Part 4 ReliaTrax page after clicking Fill active page.',
      'A screenshot of the Rose BPS Helper Part 4 response and Fill ReliaTrax result panels, with client details redacted.',
      'Whether Use bundled config changes the result.'
    ]
  };
  try {
    const tab = await getActiveTab();
    report.activeTab = {
      title: tab.title || '',
      url: redactUrlForReport(tab.url || ''),
      rawUrlWasRedacted: Boolean(tab.url && redactUrlForReport(tab.url) !== tab.url)
    };
  } catch (err) {
    report.activeTab = compactDiagnosticForReport(ensureDiagnostic(err, {
      workflow: 'Diagnostics Part 4',
      stage: 'active_tab_lookup'
    }).diagnostic);
  }
  if (scanActivePage) {
    try {
      const scan = await runInActiveTab(pageScan, [buildDiagnosticsRuntimeConfig()]);
      report.activePageScan = sanitizeDiagnosticsResultForReport(annotateDiagnosticsFillResult(scan, buildDiagnosticsRuntimeConfig()));
    } catch (err) {
      report.activePageScan = compactDiagnosticForReport(ensureDiagnostic(err, {
        workflow: 'Diagnostics Part 4',
        stage: 'preflight_scan',
        nextAction: 'Make the Diagnostics / Clinical Impressions Part 4 page the active tab and run preflight again.'
      }).diagnostic);
    }
  }
  return report;
}
async function saveDiagnosticsResponse() {
  await chrome.storage.local.set({ [STORAGE_KEYS.diagnosticsResponse]: $('diagnosticsResp')?.value || '' });
}
async function saveDiagnosticsPromptNote() {
  await chrome.storage.local.set({ [STORAGE_KEYS.diagnosticsPromptNote]: $('diagnosticsPromptNote')?.value || '' });
}

$('loadRemote').onclick = async () => {
  try {
    const url = migrateLegacyConfigUrl($('configUrl').value.trim());
    $('configUrl').value = url;
    const warnings = await loadRemoteConfigBundle(url);
    const result = { ok: !warnings.length, event: 'remote_config_loaded', configUrl: url, warnings, ...configSummary() };
    logConfigResult(result, warnings.length ? 'Remote config loaded with warnings' : 'Remote configs loaded');
    if (warnings.length) logTo('validation', { warnings });
    setStatus(warnings.length ? 'Remote config loaded with warnings' : 'Remote configs loaded');
  } catch (err) {
    setStatus('Config error');
    logConfigResult({
      ok: false,
      event: 'remote_config_error',
      configUrl: $('configUrl').value.trim(),
      message: err.message,
      nextAction: 'Open the raw GitHub URL in this same Chrome profile. If it does not load as JSON, use bundled config and check network or GitHub access.'
    }, 'Remote config error');
    logTo('validation', err.message);
  }
};
$('useBundled').onclick = async () => {
  activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
  workflowConfig = normalizeWorkflowConfigUrls(window.DEFAULT_ROSE_WORKFLOW_CONFIG || {});
  treatmentConfig = window.DEFAULT_ROSE_TREATMENT_CONFIG || { prompts: [] };
  activeQuickNotesConfig = window.DEFAULT_ROSE_QUICKNOTES_CONFIG || {};
  defaultRows = getConfigDefaultRows(activeConfig);
  resetDiagnosticsPromptPreviewBase();
  await chrome.storage.local.set({
    [STORAGE_KEYS.config]: activeConfig,
    [STORAGE_KEYS.workflowConfig]: workflowConfig,
    [STORAGE_KEYS.treatmentConfig]: treatmentConfig,
    [STORAGE_KEYS.quicknotesConfig]: activeQuickNotesConfig,
    [STORAGE_KEYS.defaultRows]: defaultRows
  });
  renderConfigState();
  logConfigResult({ ok: true, event: 'bundled_config_loaded', ...configSummary() }, 'Bundled config loaded');
  setStatus('Bundled config loaded');
};
$('addDefault').onclick = async () => {
  defaultRows.push({ question: '', answer: '' });
  await saveDefaultRows();
  setStatus('Added default answer row');
};
$('resetDefaultsFromConfig').onclick = async () => {
  defaultRows = getConfigDefaultRows(activeConfig);
  await saveDefaultRows();
  setStatus('Reset defaults from loaded config');
};
$('clearDefaults').onclick = async () => {
  defaultRows = [];
  await saveDefaultRows();
  setStatus('Cleared local defaults');
};
$('validateMerge').onclick = async () => {
  try {
    const merged = validateAndMerge();
    await saveMerged(merged);
    logTo('validation', { ok: true, topLevelKeys: Object.keys(merged), defaultAnswersLoaded: normalizedDefaultRows().length, merged });
    setStatus('Merged JSON is valid');
  } catch (err) { logTo('validation', err.message); setStatus('JSON validation failed'); }
};
$('copyMerged').onclick = async () => {
  try { const merged = validateAndMerge(); await saveMerged(merged); await navigator.clipboard.writeText(JSON.stringify(merged, null, 2)); setStatus('Copied merged JSON'); }
  catch (err) { logTo('validation', err.message); }
};
$('clearResponses').onclick = async () => {
  [1,2,3,4].forEach(i => {
    $(`resp${i}`).value = '';
    renderBpsResponseWarning(i);
  });
  await chrome.storage.local.remove([STORAGE_KEYS.responses, STORAGE_KEYS.merged]);
  setStatus('Cleared saved responses');
};
$('scanPage').onclick = async () => {
  try {
    const result = await runInActiveTab(pageScan, [buildRuntimeConfig()]);
    logTo('fillResults', result);
    await appendTrace(result);
    setStatus('Scan complete');
  } catch (err) { logTo('fillResults', err.message); }
};
$('fillPage').onclick = async () => {
  try {
    assertSafeBpsConfig(activeConfig);
    const merged = validateAndMerge();
    await saveMerged(merged);
    const result = await runInActiveTab(pageFill, [buildRuntimeConfig(), merged, $('dryRun').checked]);
    const summary = {
      event: result.event,
      timestamp: result.timestamp,
      found: result.found,
      expected: result.expected,
      dryRun: result.dryRun,
      written: result.written,
      responseWritten: result.responseWritten,
      defaultWritten: result.defaultWritten,
      checkboxWritten: result.checkboxWritten,
      checkboxTrueWritten: result.checkboxTrueWritten,
      checkboxFalseWritten: result.checkboxFalseWritten,
      checkboxWriteFailures: result.checkboxWriteFailures,
      skipped: result.skipped,
      missingCount: result.missing?.length || 0,
      warnings: result.warnings,
      unusedDefaultRows: result.unusedDefaultRows
    };
    logTo('fillResults', summary);
    await appendTrace(result);
    setStatus(result?.warnings?.length ? 'Filled with warnings' : 'Fill complete');
    queueN8nSuccessLog('bps', result);
  } catch (err) { logTo('fillResults', err.message); setStatus('Fill failed'); }
};
$('copyQuickNotesPrompt').onclick = async () => {
  const prompt = activeQuickNotesConfig?.prompts?.[0]?.body || '';
  await navigator.clipboard.writeText(prompt);
  setStatus('Copied QuickNotes prompt');
};
$('copyQuickNotesFieldMap').onclick = async () => {
  const config = activeQuickNotesConfig || {};
  const rows = (config.fieldMap || []).map(item => ({
    fillIndex: item.fillIndex,
    paths: item.paths,
    type: item.type,
    contextText: item.contextText,
    selectorHints: item.selectorHints
  }));
  await navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
  setStatus('Copied QuickNotes field map');
};
$('validateQuickNotes').onclick = async () => {
  try {
    const merged = validateQuickNotesResponse();
    await saveQuickNotesResponse();
    logTo('quicknotesResults', { ok: true, topLevelKeys: Object.keys(merged), controlsMapped: activeQuickNotesConfig?.fieldMap?.length || 0, merged });
    setStatus('QuickNotes JSON is valid');
  } catch (err) { logTo('quicknotesResults', err.message); setStatus('QuickNotes validation failed'); }
};
$('scanQuickNotesPage').onclick = async () => {
  try {
    const result = await runInActiveTab(pageScan, [buildQuickNotesRuntimeConfig()]);
    logTo('quicknotesResults', result);
    await appendTrace(result);
    setStatus('QuickNotes scan complete');
  } catch (err) { logTo('quicknotesResults', err.message); setStatus('QuickNotes scan failed'); }
};
$('fillQuickNotesPage').onclick = async () => {
  try {
    const merged = validateQuickNotesResponse();
    await saveQuickNotesResponse();
    const result = await runInActiveTab(pageFill, [buildQuickNotesRuntimeConfig(), merged, $('quicknotesDryRun').checked]);
    const summary = {
      event: result.event,
      timestamp: result.timestamp,
      found: result.found,
      expected: result.expected,
      dryRun: result.dryRun,
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
    };
    logTo('quicknotesResults', summary);
    await appendTrace(result);
    setStatus(result?.warnings?.length ? 'QuickNotes filled with warnings' : 'QuickNotes fill complete');
    queueN8nSuccessLog('quicknotes', { ...result, mode: 'quicknotes' });
  } catch (err) { logTo('quicknotesResults', err.message); setStatus('QuickNotes fill failed'); }
};
$('copyMsePrompt').onclick = async () => {
  const source = workflowMode('mse').sourcePrompt;
  if (!source?.body) {
    setStatus('No MSE prompt loaded');
    return;
  }
  await navigator.clipboard.writeText(source.body);
  setStatus('Copied MSE prompt');
};
$('copyMsePromptNotes').onclick = async () => {
  const source = workflowMode('mse').sourcePrompt;
  if (!source?.body) {
    setStatus('No MSE prompt loaded');
    return;
  }
  await navigator.clipboard.writeText(`${source.title}\n${source.source}\n\n${source.body}`);
  setStatus('Copied MSE prompt notes');
};
$('validateMseResponse').onclick = async () => {
  try {
    const summary = validateMseResponse();
    await saveMseResponse();
    logTo('mseValidation', { ok: true, ...summary });
    setStatus('MSE response saved');
  } catch (err) { logTo('mseValidation', err.message); setStatus('MSE validation failed'); }
};
$('copyMseResponse').onclick = async () => {
  try {
    validateMseResponse();
    await saveMseResponse();
    await navigator.clipboard.writeText($('mseResp').value);
    setStatus('Copied MSE response');
  } catch (err) { logTo('mseValidation', err.message); setStatus('MSE copy failed'); }
};
$('clearMseResponse').onclick = async () => {
  $('mseResp').value = '';
  await chrome.storage.local.remove([STORAGE_KEYS.mseResponse]);
  logTo('mseValidation', 'MSE response cleared.');
  setStatus('Cleared MSE response');
};
$('scanMsePage').onclick = async () => {
  try {
    const result = await runInActiveTab(pageScan, [buildMseRuntimeConfig()]);
    logTo('mseFillResults', result);
    await appendTrace({ ...result, mode: 'mse' });
    setStatus('MSE scan complete');
  } catch (err) { logTo('mseFillResults', err.message); setStatus('MSE scan failed'); }
};
$('fillMsePage').onclick = async () => {
  try {
    const rawResponse = $('mseResp').value.trim();
    let parsed = {};
    if (rawResponse) {
      validateMseResponse();
      parsed = JSON.parse(rawResponse);
    }
    await saveMseResponse();
    const config = buildMseRuntimeConfig();
    if (!config.fieldMap?.length) {
      const result = {
        event: 'fill',
        mode: 'mse',
        dryRun: $('mseDryRun').checked,
        written: 0,
        warnings: ['MSE Part 2 field map is not loaded yet. Use Discovery and Mapping to capture the form before enabling live fill.']
      };
      logTo('mseFillResults', result);
      await appendTrace(result);
      setStatus('MSE field map needed');
      return;
    }
    const result = await runInActiveTab(pageFill, [config, parsed, $('mseDryRun').checked]);
    logTo('mseFillResults', result);
    await appendTrace({ ...result, mode: 'mse' });
    setStatus(result?.warnings?.length ? 'MSE filled with warnings' : 'MSE fill complete');
    queueN8nSuccessLog('mse', { ...result, mode: 'mse' });
  } catch (err) { logTo('mseFillResults', err.message); setStatus('MSE fill failed'); }
};
$('copyAsamPrompt').onclick = async () => {
  const source = workflowMode('asam').sourcePrompt;
  if (!source?.body) {
    setStatus('No Part 3 prompt loaded');
    return;
  }
  await navigator.clipboard.writeText(source.body);
  setStatus('Copied Part 3 prompt');
};
$('copyAsamPromptNotes').onclick = async () => {
  const source = workflowMode('asam').sourcePrompt;
  if (!source?.body) {
    setStatus('No Part 3 prompt loaded');
    return;
  }
  await navigator.clipboard.writeText(`${source.title}\n${source.source}\n\n${source.body}`);
  setStatus('Copied Part 3 prompt notes');
};
$('validateAsamResponse').onclick = async () => {
  try {
    const summary = validateAsamResponse();
    await saveAsamResponse();
    logTo('asamValidation', { ok: !summary.warnings.length, ...summary });
    setStatus(summary.warnings.length ? 'Part 3 response saved with warnings' : 'Part 3 response saved');
  } catch (err) { logTo('asamValidation', err.message); setStatus('Part 3 validation failed'); }
};
$('copyAsamResponse').onclick = async () => {
  try {
    validateAsamResponse();
    await saveAsamResponse();
    await navigator.clipboard.writeText($('asamResp').value);
    setStatus('Copied Part 3 response');
  } catch (err) { logTo('asamValidation', err.message); setStatus('Part 3 copy failed'); }
};
$('clearAsamResponse').onclick = async () => {
  $('asamResp').value = '';
  await chrome.storage.local.remove([STORAGE_KEYS.asamResponse]);
  logTo('asamValidation', 'Part 3 response cleared.');
  setStatus('Cleared Part 3 response');
};
$('scanAsamPage').onclick = async () => {
  try {
    const result = await runInActiveTab(pageScan, [buildAsamRuntimeConfig()]);
    logTo('asamFillResults', result);
    await appendTrace({ ...result, mode: 'asam' });
    setStatus('Part 3 scan complete');
  } catch (err) { logTo('asamFillResults', err.message); setStatus('Part 3 scan failed'); }
};
$('fillAsamPage').onclick = async () => {
  try {
    const summary = validateAsamResponse();
    assertAsamResponseComplete(summary);
    await saveAsamResponse();
    const config = buildAsamRuntimeConfig();
    if (!config.fieldMap?.length) {
      const result = {
        event: 'fill',
        mode: 'asam',
        dryRun: $('asamDryRun').checked,
        written: 0,
        warnings: ['Case Management and ASAM Part 3 field map is not loaded yet. Use Discovery and Mapping to capture the form before enabling live fill.']
      };
      logTo('asamFillResults', result);
      await appendTrace(result);
      setStatus('Part 3 field map needed');
      return;
    }
    const result = await runInActiveTab(pageFill, [config, summary.normalized, $('asamDryRun').checked]);
    logTo('asamFillResults', result);
    await appendTrace({ ...result, mode: 'asam' });
    setStatus(result?.warnings?.length ? 'Part 3 filled with warnings' : 'Part 3 fill complete');
    queueN8nSuccessLog('asam', { ...result, mode: 'asam' });
  } catch (err) { logTo('asamFillResults', err.message); setStatus('Part 3 fill failed'); }
};
async function refreshDiagnosticsPromptFromPage() {
  const context = await runInActiveTab(pageExtractDiagnosticsPart3Context, []);
  const basePrompt = buildDiagnosticsPromptFromContext(context, { includePromptNote: false });
  const prompt = applyDiagnosticsPromptNote(basePrompt);
  renderDiagnosticsPrompt(basePrompt);
  logTo('diagnosticsFillResults', {
    event: context.event,
    extractedFunctioning: context.functioning?.length || 0,
    extractedDimensions: context.dimensions?.length || 0,
    warnings: context.warnings || []
  });
  return { prompt, context };
}
$('refreshDiagnosticsPrompt').onclick = async () => {
  try {
    const { context } = await refreshDiagnosticsPromptFromPage();
    setStatus((context.warnings || []).length ? 'Diagnostics prompt refreshed with warnings' : 'Diagnostics prompt refreshed');
  } catch (err) { logErrorTo('diagnosticsFillResults', ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'prompt_context_refresh', nextAction: 'Make the completed Part 3 Case Management and ASAM page active, then refresh the Part 4 prompt again.' })); setStatus('Diagnostics prompt refresh failed'); }
};
$('copyDiagnosticsPrompt').onclick = async () => {
  try {
    const { prompt, context } = await refreshDiagnosticsPromptFromPage();
    await navigator.clipboard.writeText(prompt);
    setStatus((context.warnings || []).length ? 'Copied Diagnostics prompt with warnings' : 'Copied Diagnostics prompt');
  } catch (err) { logErrorTo('diagnosticsFillResults', ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'prompt_copy', nextAction: 'Make the completed Part 3 Case Management and ASAM page active, then copy the Part 4 prompt again.' })); setStatus('Diagnostics prompt copy failed'); }
};
$('copyDiagnosticsPromptNotes').onclick = async () => {
  try {
    const source = workflowMode('diagnostics').sourcePrompt;
    const { prompt, context } = await refreshDiagnosticsPromptFromPage();
    await navigator.clipboard.writeText(`${source?.title || 'Diagnostics Part 4 prompt'}\n${source?.source || ''}\n\n${prompt}`);
    setStatus((context.warnings || []).length ? 'Copied Diagnostics prompt notes with warnings' : 'Copied Diagnostics prompt notes');
  } catch (err) { logErrorTo('diagnosticsFillResults', ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'prompt_notes_copy', nextAction: 'Make the completed Part 3 Case Management and ASAM page active, then copy the Part 4 prompt notes again.' })); setStatus('Diagnostics prompt notes copy failed'); }
};
$('validateDiagnosticsResponse').onclick = async () => {
  try {
    const summary = validateDiagnosticsResponse();
    await saveDiagnosticsResponse();
    logTo('diagnosticsValidation', { ok: !summary.warnings.length, ...summary });
    setStatus(summary.warnings.length ? 'Diagnostics response saved with warnings' : 'Diagnostics response saved');
  } catch (err) {
    const diagnosticError = ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'response_validation', nextAction: 'Paste one valid Diagnostics Part 4 JSON object, then validate again before filling.' });
    logErrorTo('diagnosticsValidation', diagnosticError);
    setStatus(diagnosticError?.diagnostic?.category === 'invalid_json' ? 'Diagnostics JSON invalid' : 'Diagnostics validation failed');
  }
};
$('copyDiagnosticsResponse').onclick = async () => {
  try {
    validateDiagnosticsResponse();
    await saveDiagnosticsResponse();
    await navigator.clipboard.writeText($('diagnosticsResp').value);
    setStatus('Copied Diagnostics response');
  } catch (err) {
    const diagnosticError = ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'response_copy', nextAction: 'Validate the Diagnostics Part 4 response, then copy it again.' });
    logErrorTo('diagnosticsValidation', diagnosticError);
    setStatus(diagnosticError?.diagnostic?.category === 'invalid_json' ? 'Diagnostics JSON invalid' : 'Diagnostics copy failed');
  }
};
$('clearDiagnosticsResponse').onclick = async () => {
  $('diagnosticsResp').value = '';
  await chrome.storage.local.remove([STORAGE_KEYS.diagnosticsResponse]);
  logTo('diagnosticsValidation', 'Diagnostics response cleared.');
  setStatus('Cleared Diagnostics response');
};
$('runDiagnosticsPreflight').onclick = async () => {
  try {
    setStatus('Running Part 4 preflight...');
    const report = await buildDiagnosticsTroubleshootingReport({ scanActivePage: true });
    logTo('diagnosticsTroubleshooting', report);
    setStatus(report.activePageScan?.diagnosticAnnotations?.length || report.activePageScan?.category ? 'Part 4 preflight found issues' : 'Part 4 preflight complete');
  } catch (err) {
    logErrorTo('diagnosticsTroubleshooting', ensureDiagnostic(err, {
      workflow: 'Diagnostics Part 4',
      stage: 'preflight',
      nextAction: 'Copy the visible error and include a screenshot of the active ReliaTrax page.'
    }));
    setStatus('Part 4 preflight failed');
  }
};
$('copyDiagnosticsTroubleshooting').onclick = async () => {
  try {
    setStatus('Building Part 4 troubleshooting report...');
    const report = await buildDiagnosticsTroubleshootingReport({ scanActivePage: true });
    logTo('diagnosticsTroubleshooting', report);
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setStatus('Copied Part 4 troubleshooting report');
  } catch (err) {
    logErrorTo('diagnosticsTroubleshooting', ensureDiagnostic(err, {
      workflow: 'Diagnostics Part 4',
      stage: 'copy_troubleshooting_report',
      nextAction: 'Run Part 4 preflight and manually copy the visible report.'
    }));
    setStatus('Part 4 report copy failed');
  }
};
$('scanDiagnosticsPage').onclick = async () => {
  try {
    const result = await runInActiveTab(pageScan, [buildDiagnosticsRuntimeConfig()]);
    const annotatedResult = annotateDiagnosticsFillResult(result, buildDiagnosticsRuntimeConfig());
    logTo('diagnosticsFillResults', annotatedResult);
    await appendTrace({ ...annotatedResult, mode: 'diagnostics' });
    setStatus(annotatedResult?.diagnosticAnnotations?.length ? 'Diagnostics scan has warnings' : 'Diagnostics scan complete');
  } catch (err) { logErrorTo('diagnosticsFillResults', ensureDiagnostic(err, { workflow: 'Diagnostics Part 4', stage: 'scan', nextAction: 'Make the Diagnostics / Clinical Impressions page active, then run Scan active page again.' })); setStatus('Diagnostics scan failed'); }
};
$('fillDiagnosticsPage').onclick = async () => {
  try {
    setStatus('Diagnostics fill starting...');
    logTo('diagnosticsFillResults', {
      event: 'diagnostics_fill_starting',
      timestamp: new Date().toISOString(),
      message: 'Validating the pasted Part 4 JSON and checking the active ReliaTrax tab before writing.'
    });
    const summary = validateDiagnosticsResponse();
    assertDiagnosticsResponseComplete(summary);
    await saveDiagnosticsResponse();
    const config = buildDiagnosticsRuntimeConfig();
    if (!config.fieldMap?.length) {
      const result = {
        event: 'fill',
        mode: 'diagnostics',
        dryRun: $('diagnosticsDryRun').checked,
        written: 0,
        warnings: ['Diagnostics Part 4 field map is not loaded yet. Use bundled or remote workflow config before filling.'],
        diagnosticAnnotations: [{
          source: 'ReliaTrax form fields',
          stage: 'pre_fill',
          category: 'field_map_not_loaded',
          blocking: true,
          workflow: 'Diagnostics Part 4',
          message: 'The Diagnostics Part 4 JSON parsed successfully, but no Part 4 field map is loaded.',
          nextAction: 'Load the bundled or remote workflow config, then scan the active Part 4 page before filling.'
        }]
      };
      logTo('diagnosticsFillResults', result);
      await appendTrace(result);
      setStatus('Diagnostics field map needed');
      return;
    }
    const result = await runInActiveTab(pageFill, [config, summary.normalized, $('diagnosticsDryRun').checked]);
    const annotatedResult = annotateDiagnosticsFillResult(result, config);
    logTo('diagnosticsFillResults', annotatedResult);
    await appendTrace({ ...annotatedResult, mode: 'diagnostics' });
    if (result?.error) {
      setStatus('Diagnostics form field error');
      return;
    }
    setStatus(annotatedResult?.diagnosticAnnotations?.length || annotatedResult?.warnings?.length ? 'Diagnostics filled with warnings' : 'Diagnostics fill complete');
    queueN8nSuccessLog('diagnostics', { ...annotatedResult, mode: 'diagnostics' });
  } catch (err) {
    const diagnosticError = ensureDiagnostic(err, {
      workflow: 'Diagnostics Part 4',
      stage: 'fill',
      nextAction: 'Run Part 4 preflight, copy the troubleshooting report, and confirm the active tab is the Diagnostics / Clinical Impressions page.'
    });
    logErrorTo('diagnosticsFillResults', diagnosticError);
    setStatus(diagnosticError?.diagnostic?.category === 'invalid_json' ? 'Diagnostics JSON invalid' : 'Diagnostics fill failed');
  }
};
$('copyTreatmentPrompt').onclick = async () => {
  const prompt = selectedTreatmentPrompt();
  const effectivePrompt = effectiveTreatmentPrompt(prompt);
  if (!effectivePrompt) {
    setStatus('No Treatment Plan prompt loaded');
    return;
  }
  await navigator.clipboard.writeText(effectivePrompt);
  setStatus(`Copied Treatment Plan prompt ${prompt.number}`);
};
$('copyTreatmentPromptNotes').onclick = async () => {
  const prompt = selectedTreatmentPrompt();
  const effectivePrompt = effectiveTreatmentPrompt(prompt);
  if (!effectivePrompt) {
    setStatus('No Treatment Plan prompt loaded');
    return;
  }
  const source = treatmentConfig?.source || {};
  await navigator.clipboard.writeText([
    prompt.title,
    `${source.subject || 'Treatment Plan Prompts (4)'} | ${source.sender || ''} | ${source.receivedAt || ''}`,
    '',
    effectivePrompt
  ].join('\n'));
  setStatus(`Copied Treatment Plan prompt ${prompt.number} with notes`);
};
$('validateTreatmentResponse').onclick = async () => {
  try {
    const summary = validateTreatmentResponse();
    await saveTreatmentResponse();
    logTo('treatmentValidation', {
      ok: summary.ok,
      scenario: summary.scenario,
      parsedProblems: summary.parsedProblems,
      objectiveCounts: summary.objectiveCounts,
      interventionCounts: summary.interventionCounts,
      warnings: summary.warnings,
      normalized: summary.normalized
    });
    setStatus(summary.warnings.length ? 'Treatment Plan parsed with warnings' : 'Treatment Plan response validated');
  } catch (err) {
    logErrorTo('treatmentValidation', ensureDiagnostic(err, {
      workflow: 'Treatment Plan',
      stage: 'response_validation',
      nextAction: 'Paste the complete output from the selected Rose prompt, then validate again.'
    }));
    setStatus('Treatment Plan validation failed');
  }
};
$('copyTreatmentJson').onclick = async () => {
  try {
    const summary = validateTreatmentResponse();
    await saveTreatmentResponse();
    await navigator.clipboard.writeText(JSON.stringify(summary.normalized, null, 2));
    setStatus('Copied parsed Treatment Plan JSON');
  } catch (err) {
    logErrorTo('treatmentValidation', ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'response_copy' }));
    setStatus('Treatment Plan JSON copy failed');
  }
};
$('clearTreatmentResponse').onclick = async () => {
  $('treatmentResp').value = '';
  await chrome.storage.local.remove([STORAGE_KEYS.treatmentResponse]);
  logTo('treatmentValidation', 'Treatment Plan response cleared.');
  setStatus('Cleared Treatment Plan response');
};
$('scanTreatmentPage').onclick = async () => {
  try {
    const context = await runInActiveTab(pageExtractTreatmentPlanContext, []);
    const scan = await runInActiveTab(pageScan, [buildTreatmentRuntimeConfig()]);
    const result = { context, scan };
    logTo('treatmentFillResults', result);
    await appendTrace({ ...result, mode: 'treatment' });
    setStatus(context?.warnings?.length ? 'Treatment Plan scan has warnings' : 'Treatment Plan scan complete');
  } catch (err) {
    logErrorTo('treatmentFillResults', ensureDiagnostic(err, {
      workflow: 'Treatment Plan',
      stage: 'scan',
      nextAction: 'Open the Treatment Plan page, then capture the support bundle.'
    }));
    setStatus('Treatment Plan scan failed');
  }
};
$('fillTreatmentPage').onclick = async () => {
  try {
    setStatus('Treatment Plan fill starting...');
    const prepared = await prepareTreatmentResponseForFill();
    await saveTreatmentResponse();
    const config = buildTreatmentRuntimeConfig();
    const result = await runInActiveTab(pageFill, [config, prepared.normalized, $('treatmentDryRun').checked]);
    const combined = {
      ...result,
      mode: 'treatment',
      scenario: selectedTreatmentPrompt()?.id || '',
      context: prepared.context,
      validationWarnings: prepared.validation.warnings
    };
    logTo('treatmentFillResults', combined);
    await appendTrace(combined);
    if (result?.missing?.length) {
      setStatus($('treatmentDryRun').checked ? 'Treatment Plan dry run needs field mapping' : 'Treatment Plan filled with missing fields');
    } else {
      setStatus($('treatmentDryRun').checked ? 'Treatment Plan dry run complete' : 'Treatment Plan fill complete');
    }
    if (!$('treatmentDryRun').checked) queueN8nSuccessLog('treatment', combined);
  } catch (err) {
    logErrorTo('treatmentFillResults', ensureDiagnostic(err, {
      workflow: 'Treatment Plan',
      stage: 'fill',
      nextAction: 'Keep Dry run enabled, capture the Treatment Plan support bundle, and review every missing label before retrying.'
    }));
    setStatus('Treatment Plan fill failed');
  }
};
$('captureTreatmentSupport').onclick = async () => {
  try {
    setStatus('Capturing Treatment Plan support bundle...');
    const bundle = await buildTreatmentSupportBundle();
    logTo('treatmentTroubleshooting', bundle);
    setStatus(bundle.warnings?.length ? 'Treatment Plan support captured with warnings' : 'Treatment Plan support captured');
  } catch (err) {
    logErrorTo('treatmentTroubleshooting', ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'support_capture' }));
    setStatus('Treatment Plan support capture failed');
  }
};
$('copyTreatmentSupport').onclick = async () => {
  try {
    const bundle = await buildTreatmentSupportBundle();
    logTo('treatmentTroubleshooting', bundle);
    await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setStatus('Copied Treatment Plan support bundle');
  } catch (err) {
    logErrorTo('treatmentTroubleshooting', ensureDiagnostic(err, { workflow: 'Treatment Plan', stage: 'support_copy' }));
    setStatus('Treatment Plan support copy failed');
  }
};
$('copyTraceLog').onclick = async () => {
  await navigator.clipboard.writeText(JSON.stringify(traceLog || [], null, 2));
  setStatus('Copied trace log');
};
$('clearTraceLog').onclick = async () => {
  traceLog = [];
  await saveTraceLog();
  setStatus('Cleared trace log');
};
$('discoverPage').onclick = async () => {
  try {
    const pathPrefix = $('discoveryPrefix').value.trim();
    await chrome.storage.local.set({ [STORAGE_KEYS.discoveryPrefix]: pathPrefix });
    const result = await runInActiveTab(pageDiscover, [{
      pathPrefix,
      includeHiddenControls: Boolean($('discoverHiddenControls')?.checked),
      capturePageSource: Boolean($('discoverPageSource')?.checked),
      expandInteractiveSections: Boolean($('discoverClickSections')?.checked)
    }]);
    if (result?.error) throw new Error(result.error);
    discoveryReport = result;
    const storedReport = result.pageSource?.html
      ? {
          ...result,
          pageSource: {
            ...result.pageSource,
            html: '',
            htmlOmittedFromStorage: true
          }
        }
      : result;
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.discoveryReport]: storedReport });
    } catch {
      await chrome.storage.local.remove([STORAGE_KEYS.discoveryReport]);
    }
    renderDiscoveryReport();
    await appendTrace(storedReport);
    setStatus(`Discovered ${result.totalControls} controls (${result.hiddenControlCount || 0} hidden/collapsed)`);
  } catch (err) { logTo('discoveryResults', err.message); setStatus('Discovery failed'); }
};
async function applyVisualMapping(mode) {
  try {
    const pathPrefix = $('discoveryPrefix').value.trim();
    const action = mode === 'off' ? 'hide' : 'show';
    const result = await runInActiveTab(pageVisualMapping, [{ action, mode, pathPrefix }]);
    if (result?.error) throw new Error(result.error);
    visualMappingMode = result.mode === 'off' ? 'off' : mode;
    renderVisualMappingButtons();
    setStatus(visualMappingMode === 'off' ? 'Page labels hidden' : `Page ${visualMappingMode === 'hover' ? 'hover ' : ''}labels shown`);
  } catch (err) {
    visualMappingMode = 'off';
    renderVisualMappingButtons();
    logTo('discoveryResults', err.message);
    setStatus('Page labels failed');
  }
}
$('showDiscoveryLabels').onclick = () => applyVisualMapping(visualMappingMode === 'labels' ? 'off' : 'labels');
$('showDiscoveryHoverLabels').onclick = () => applyVisualMapping(visualMappingMode === 'hover' ? 'off' : 'hover');
$('hideDiscoveryLabels').onclick = () => applyVisualMapping('off');
$('copyDiscoveryReport').onclick = async () => {
  await navigator.clipboard.writeText(formatDiscoveryReport(discoveryReport));
  setStatus('Copied discovery report');
};
$('copyDiscoveryJson').onclick = async () => {
  await navigator.clipboard.writeText(JSON.stringify(discoveryReport || {}, null, 2));
  setStatus('Copied discovery JSON');
};
$('clearDiscoveryReport').onclick = async () => {
  discoveryReport = null;
  await chrome.storage.local.remove([STORAGE_KEYS.discoveryReport]);
  renderDiscoveryReport();
  await applyVisualMapping('off');
  setStatus('Cleared discovery report');
};
$('discoveryPrefix').addEventListener('input', async () => {
  await chrome.storage.local.set({ [STORAGE_KEYS.discoveryPrefix]: $('discoveryPrefix').value });
});
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => saveMode(btn.dataset.mode).catch(err => setStatus(err.message)));
});
[1,2,3,4].forEach(i => $(`resp${i}`).addEventListener('input', async () => {
  refreshBpsResponseWarning(i);
  await saveResponses();
}));
[1,2,3,4].forEach(i => $(`resp${i}Repair`)?.addEventListener('click', () => {
  repairBpsResponseWithN8n(i);
}));
['mse', 'asam', 'diagnostics', 'treatment', 'quicknotes'].forEach(responseType => {
  const target = jsonRepairTarget(responseType);
  $(target.buttonId)?.addEventListener('click', () => repairJsonResponseWithN8n(responseType));
});
$('quicknotesResp')?.addEventListener('input', saveQuickNotesResponse);
$('mseResp')?.addEventListener('input', saveMseResponse);
$('asamResp')?.addEventListener('input', saveAsamResponse);
$('diagnosticsResp')?.addEventListener('input', saveDiagnosticsResponse);
$('treatmentResp')?.addEventListener('input', saveTreatmentResponse);
$('treatmentScenario')?.addEventListener('change', async () => {
  activeTreatmentScenario = $('treatmentScenario').value;
  await chrome.storage.local.set({ [STORAGE_KEYS.treatmentScenario]: activeTreatmentScenario });
  renderTreatmentPrompt();
  logTo('treatmentValidation', 'Scenario changed. Validate the Treatment Plan response against the selected prompt.');
});
$('diagnosticsPromptNote')?.addEventListener('input', async () => {
  await saveDiagnosticsPromptNote();
  renderDiagnosticsPrompt();
});
if ($('sendTroubleshootingInfo')) {
  $('sendTroubleshootingInfo').onclick = sendN8nTroubleshootingInfo;
}
loadState();
