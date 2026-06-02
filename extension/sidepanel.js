
const STORAGE_KEYS = {
  config: 'roseBpsConfig',
  configUrl: 'roseBpsConfigUrl',
  responses: 'roseBpsResponses',
  merged: 'roseBpsMerged',
  defaultRows: 'roseBpsDefaultRows',
  traceLog: 'roseBpsTraceLog',
  mode: 'roseBpsActiveMode',
  workflowConfig: 'roseWorkflowConfig',
  quicknotesConfig: 'roseQuickNotesConfig',
  discoveryReport: 'roseBpsDiscoveryReport',
  discoveryPrefix: 'roseBpsDiscoveryPrefix',
  quicknotesResponse: 'roseQuickNotesResponse',
  mseResponse: 'roseMseResponse',
  asamResponse: 'roseAsamResponse'
};

const CONFIG_REPO_DATA_DIR = 'github-data';
const CONFIG_FILE_RE = /(rose-reliatrax-bps-config\.json|rose-reliatrax-workflows-config\.json|rose-quicknotes-config\.json)$/;
const CONFIG_REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/zachbush96/Rose-Form/main/github-data/';
const DEFAULT_REMOTE_CONFIG_URL = `${CONFIG_REPO_RAW_BASE_URL}rose-reliatrax-bps-config.json`;
const DEFAULT_WORKFLOW_CONFIG_URL = `${CONFIG_REPO_RAW_BASE_URL}rose-reliatrax-workflows-config.json`;
const REMOTE_CONFIG_TIMEOUT_MS = 10000;

let activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
let activeQuickNotesConfig = window.DEFAULT_ROSE_QUICKNOTES_CONFIG;
let workflowConfig = window.DEFAULT_ROSE_WORKFLOW_CONFIG || {};
let defaultRows = [];
let traceLog = [];
let activeMode = 'bps';
let discoveryReport = null;
let visualMappingMode = 'off';
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

function setStatus(msg) { $('status').textContent = msg; }
function logTo(id, value) { $(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function isBlank(value) { return value === undefined || value === null || value === ''; }
function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) target[k] = deepMerge(target[k] || {}, v);
    else target[k] = v;
  }
  return target;
}
function parseJsonBox(id) {
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
function renderPlannedModeSource() {
  const source = modeSourcePrompt(activeMode);
  const sourceBox = $('plannedModeSource');
  if (!sourceBox) return;
  if (!source) {
    sourceBox.textContent = '';
    return;
  }
  sourceBox.textContent = `${source.title}\n${source.source}\n\n${source.body}`;
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
  if (['diagnostics', 'treatment'].includes(activeMode)) {
    $('plannedModeTitle').textContent = modeTitle(activeMode);
    $('plannedModeBody').textContent = modeDescription(activeMode);
  }
  renderMsePrompt();
  renderAsamPrompt();
  renderMseDefaults();
  renderPlannedModeSource();
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
}
async function loadRemoteConfig(url, { preserveDefaultRows = false } = {}) {
  const normalizedUrl = migrateLegacyConfigUrl(url);
  if (!normalizedUrl) throw new Error('Paste a raw GitHub config URL first.');
  const cfg = await fetchRemoteConfig(normalizedUrl);
  activeConfig = cfg;
  if (!preserveDefaultRows) {
    defaultRows = getConfigDefaultRows(cfg);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: cfg, [STORAGE_KEYS.configUrl]: normalizedUrl, [STORAGE_KEYS.defaultRows]: defaultRows });
  renderConfigState();
}
async function loadRemoteWorkflowConfig(url = DEFAULT_WORKFLOW_CONFIG_URL) {
  const normalizedUrl = migrateLegacyConfigUrl(url);
  if (!normalizedUrl) throw new Error('Paste a raw GitHub config URL first.');
  const cfg = normalizeWorkflowConfigUrls(await fetchRemoteJson(normalizedUrl), normalizedUrl);
  if (!cfg?.modes || typeof cfg.modes !== 'object') throw new Error('Workflow config is missing modes.');
  workflowConfig = cfg;
  await chrome.storage.local.set({ [STORAGE_KEYS.workflowConfig]: cfg });
  renderMode();
}
async function loadRemoteQuickNotesConfig() {
  const url = migrateLegacyConfigUrl(workflowMode('quicknotes').configUrl);
  if (!url) return;
  activeQuickNotesConfig = await fetchRemoteConfig(url);
  await chrome.storage.local.set({ [STORAGE_KEYS.quicknotesConfig]: activeQuickNotesConfig });
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
  await loadRemoteConfig(url, options);
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
    STORAGE_KEYS.quicknotesConfig,
    STORAGE_KEYS.discoveryReport,
    STORAGE_KEYS.discoveryPrefix,
    STORAGE_KEYS.quicknotesResponse,
    STORAGE_KEYS.mseResponse,
    STORAGE_KEYS.asamResponse
  ]);
  activeConfig = data[STORAGE_KEYS.config] || window.DEFAULT_ROSE_BPS_CONFIG;
  workflowConfig = normalizeWorkflowConfigUrls(data[STORAGE_KEYS.workflowConfig] || window.DEFAULT_ROSE_WORKFLOW_CONFIG || workflowConfig);
  activeQuickNotesConfig = data[STORAGE_KEYS.quicknotesConfig] || window.DEFAULT_ROSE_QUICKNOTES_CONFIG || activeQuickNotesConfig;
  defaultRows = Array.isArray(data[STORAGE_KEYS.defaultRows]) ? data[STORAGE_KEYS.defaultRows] : getConfigDefaultRows(activeConfig);
  traceLog = Array.isArray(data[STORAGE_KEYS.traceLog]) ? data[STORAGE_KEYS.traceLog] : [];
  activeMode = data[STORAGE_KEYS.mode] || 'bps';
  discoveryReport = data[STORAGE_KEYS.discoveryReport] || null;
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
  if (storedConfigUrl && configUrl !== storedConfigUrl) {
    await chrome.storage.local.set({ [STORAGE_KEYS.configUrl]: configUrl });
  }
  $('configUrl').value = configUrl;
  $('discoveryPrefix').value = data[STORAGE_KEYS.discoveryPrefix] || '';
  if ($('quicknotesResp')) $('quicknotesResp').value = data[STORAGE_KEYS.quicknotesResponse] || '';
  if ($('mseResp')) $('mseResp').value = data[STORAGE_KEYS.mseResponse] || '';
  if ($('asamResp')) $('asamResp').value = data[STORAGE_KEYS.asamResponse] || '';
  (data[STORAGE_KEYS.responses] || []).forEach((v, i) => { if ($(`resp${i+1}`)) $(`resp${i+1}`).value = v || ''; });
  renderTraceLog();
  renderDiscoveryReport();
  renderVisualMappingButtons();
  renderMode();
  try {
    setStatus('Loading remote config...');
    await loadRemoteConfig(configUrl, { preserveDefaultRows: Array.isArray(data[STORAGE_KEYS.defaultRows]) });
    setStatus('Remote config loaded');
  } catch (err) {
    renderConfigState();
    setStatus('Remote config unavailable');
    logTo('validation', err.message);
  }
}
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found.');
  return tab.id;
}
async function runInActiveTab(func, args) {
  const tabId = await getActiveTabId();
  const [result] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  if (result?.result?.error) throw new Error(result.result.error);
  return result?.result;
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
    return {
      event: 'scan',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      selector,
      found: fields.length,
      expected: config.expectedFieldCount,
      first: fields.slice(0, 5).map((el, i) => describe(el, i)),
      last: fields.slice(-5).map((el, offset) => describe(el, fields.length - 5 + offset))
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
  const applyClientNameToNarrative = (value) => {
    if (typeof value !== 'string' || !clientFirstNameFromData) return value;
    return value
      .replace(/\[(?:client name|client first name|first name)\]/gi, clientFirstNameFromData)
      .replace(/\b[Tt]he client['’]s\b/g, `${clientFirstNameFromData}'s`)
      .replace(/\b[Tt]he client\b/g, clientFirstNameFromData)
      .replace(/\bClient['’]s\b/g, `${clientFirstNameFromData}'s`)
      .replace(/\bClient\b/g, clientFirstNameFromData);
  };
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
    return applyClientNameToNarrative(value);
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
      return `${clientSubject()} reports smoking and vaping${frequency ? ` ${frequency}` : ', frequency not specified'}.`;
    }
    const normalizedDetail = normalizeAction(detail);
    if (hasVaping && !hasSpecificNonVape) {
      const frequency = tobaccoFrequencyDetail(normalizedDetail);
      return `${clientSubject()} reports vaping${frequency ? ` ${frequency}` : ', frequency not specified'}.`;
    }
    if (hasSpecificNonVape && tobaccoFrequencyMissing(detail)) {
      return `${clientSubject()} reports ${normalizedDetail || 'tobacco use'}, frequency not specified.`;
    }
    return `${clientSubject()} reports ${withPeriod(normalizedDetail || 'smoking and vaping, frequency not specified')}`;
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
      ['attempt_count', 'attempt_dates', 'attempt_methods', 'under_influence_during_attempts', 'feelings_about_past_attempts'].forEach(field => {
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
    if (!substanceMatch || isBlankLocal(value)) return applyClientNameToNarrative(value);
    if (substanceMatch[1] === '3') {
      return applyClientNameToNarrative(parseSubstanceAgeValue(value).age || value);
    }
    const substance = firstUsefulPathValue(merged, [`substance_use.substance_${substanceMatch[1]}.substance`]);
    const text = String(value);
    if (!hasUsefulValue(substance) || /age of first use:/i.test(text)) return applyClientNameToNarrative(value);
    return applyClientNameToNarrative(`${substance}\n\nAge of first use: ${text}`);
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
    const resolveMappedField = (item) => {
      const mappedDataQnFieldId = String(item.dataQnFieldId || '').trim();
      if (mappedDataQnFieldId && fieldsByDataQnFieldId.has(mappedDataQnFieldId)) {
        return { el: fieldsByDataQnFieldId.get(mappedDataQnFieldId), strategy: 'data-qn-field-id' };
      }
      const byAsamSafetyLabel = findAsamSafetyPlanningControlByLabel(item);
      if (byAsamSafetyLabel) return { el: byAsamSafetyLabel, strategy: 'asam-safety-label-row' };
      return { el: fields[item.fillIndex], strategy: 'fill-index' };
    };
    for (const item of (config.fieldMap || [])) {
      const resolvedField = resolveMappedField(item);
      const el = resolvedField.el;
      if (!el) {
        const missing = { action: 'missing_field', fillIndex: item.fillIndex, paths: item.paths || [] };
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

$('loadRemote').onclick = async () => {
  try {
    const url = migrateLegacyConfigUrl($('configUrl').value.trim());
    $('configUrl').value = url;
    const warnings = await loadRemoteConfigBundle(url);
    if (warnings.length) logTo('validation', { warnings });
    setStatus(warnings.length ? 'Remote config loaded with warnings' : 'Remote configs loaded');
  } catch (err) { setStatus('Config error'); logTo('validation', err.message); }
};
$('useBundled').onclick = async () => {
  activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
  workflowConfig = normalizeWorkflowConfigUrls(window.DEFAULT_ROSE_WORKFLOW_CONFIG || {});
  activeQuickNotesConfig = window.DEFAULT_ROSE_QUICKNOTES_CONFIG || {};
  defaultRows = getConfigDefaultRows(activeConfig);
  await chrome.storage.local.set({
    [STORAGE_KEYS.config]: activeConfig,
    [STORAGE_KEYS.workflowConfig]: workflowConfig,
    [STORAGE_KEYS.quicknotesConfig]: activeQuickNotesConfig,
    [STORAGE_KEYS.defaultRows]: defaultRows
  });
  renderConfigState();
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
  [1,2,3,4].forEach(i => $(`resp${i}`).value = '');
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
  } catch (err) { logTo('asamFillResults', err.message); setStatus('Part 3 fill failed'); }
};
$('copyModeSourcePrompt').onclick = async () => {
  const source = modeSourcePrompt(activeMode);
  if (!source) {
    setStatus('No source prompt for this mode');
    return;
  }
  await navigator.clipboard.writeText(source.body || '');
  setStatus(`Copied ${source.title}`);
};
$('copyModeSourceNotes').onclick = async () => {
  const source = modeSourcePrompt(activeMode);
  if (!source) {
    setStatus('No source notes for this mode');
    return;
  }
  await navigator.clipboard.writeText(`${source.title}\n${source.source}\n\n${source.body || ''}`);
  setStatus(`Copied ${source.title} notes`);
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
[1,2,3,4].forEach(i => $(`resp${i}`).addEventListener('input', saveResponses));
$('quicknotesResp')?.addEventListener('input', saveQuickNotesResponse);
$('mseResp')?.addEventListener('input', saveMseResponse);
$('asamResp')?.addEventListener('input', saveAsamResponse);
loadState();
