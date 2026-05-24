
const STORAGE_KEYS = {
  config: 'roseBpsConfig',
  configUrl: 'roseBpsConfigUrl',
  responses: 'roseBpsResponses',
  merged: 'roseBpsMerged',
  defaultRows: 'roseBpsDefaultRows',
  traceLog: 'roseBpsTraceLog',
  mode: 'roseBpsActiveMode',
  discoveryReport: 'roseBpsDiscoveryReport',
  discoveryPrefix: 'roseBpsDiscoveryPrefix'
};

const DEFAULT_REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/zachbush96/Rose_Automation/refs/heads/main/rose-reliatrax-bps-config.json';
const REMOTE_CONFIG_TIMEOUT_MS = 10000;

let activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
let defaultRows = [];
let traceLog = [];
let activeMode = 'bps';
let discoveryReport = null;
let visualMappingMode = 'off';
const $ = (id) => document.getElementById(id);

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
let defaultSaveTimer = null;
function debounceSaveDefaults() {
  clearTimeout(defaultSaveTimer);
  defaultSaveTimer = setTimeout(() => saveDefaultRows(false).catch(err => setStatus(err.message)), 450);
}
function renderTraceLog() {
  logTo('traceLog', traceLog?.length ? traceLog : 'No trace entries yet. Run Scan or Fill to create logs.');
}
const MODE_DESCRIPTIONS = {
  bps: 'Current production workflow for BPS Part 1.',
  mse: 'Reserved for MSE Part 2. Use Discovery and Mapping to capture the MSE form before building the fill map.',
  asam: 'Reserved for Case Management and ASAM Part 3. Discovery data will drive the severity grid and ASAM field map.',
  diagnostics: 'Reserved for Diagnostics Part 4. Discovery data will identify screening, recommendation, DSM V, and level-of-care fields.',
  treatment: 'Reserved for Treatment Plan. Discovery data will identify the separate plan fields and copy/paste sections.',
  discovery: 'Scan unknown ReliaTrax or similar forms and export a mapping package for Zach.'
};
const PLANNED_MODE_TITLES = {
  mse: 'MSE Part 2',
  asam: 'Case Management and ASAM Part 3',
  diagnostics: 'Diagnostics Part 4',
  treatment: 'Treatment Plan'
};
function renderMode() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === activeMode);
  });
  $('modeDescription').textContent = MODE_DESCRIPTIONS[activeMode] || MODE_DESCRIPTIONS.bps;
  document.querySelectorAll('.mode-panel').forEach(panel => {
    const classes = [...panel.classList];
    const visible = classes.includes(`mode-${activeMode}`);
    panel.classList.toggle('hidden', !visible);
  });
  if (['mse', 'asam', 'diagnostics', 'treatment'].includes(activeMode)) {
    $('plannedModeTitle').textContent = PLANNED_MODE_TITLES[activeMode] || 'Mode setup';
    $('plannedModeBody').textContent = MODE_DESCRIPTIONS[activeMode];
  }
}
async function saveMode(mode) {
  activeMode = mode || 'bps';
  await chrome.storage.local.set({ [STORAGE_KEYS.mode]: activeMode });
  renderMode();
}
function formatDiscoveryReport(report) {
  if (!report) return 'No discovery scan yet.';
  const lines = [
    'ReliaTrax Form Discovery Report',
    '',
    `Page: ${report.title || '(untitled)'}`,
    `URL: ${report.url || ''}`,
    `Scanned: ${report.timestamp || ''}`,
    `Suggested path prefix: ${report.pathPrefix || '(none)'}`,
    `Controls found: ${report.totalControls}`,
    `Text inputs/textareas/selects: ${report.textLikeCount}`,
    `Checkboxes: ${report.checkboxCount}`,
    `Radios: ${report.radioCount}`,
    '',
    'Sections:'
  ];
  (report.sections || []).forEach(section => {
    lines.push(`- ${section.name}: ${section.controlCount} control${section.controlCount === 1 ? '' : 's'}`);
  });
  lines.push('', 'Controls:');
  (report.controls || []).forEach(control => {
    const options = (control.options || []).length ? ` | options: ${control.options.join(', ')}` : '';
    const required = control.required ? ' | required' : '';
    lines.push(`${control.index}. [${control.section || 'Unsectioned'}] ${control.label || control.name || control.id || control.type}`);
    lines.push(`   type: ${control.type}${required} | suggestedPath: ${control.suggestedPath || ''}${options}`);
    if (control.placeholder) lines.push(`   placeholder: ${control.placeholder}`);
    if (control.name || control.id) lines.push(`   id/name: ${control.id || '(no id)'} / ${control.name || '(no name)'}`);
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
async function fetchRemoteConfig(url) {
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
  const cfg = await res.json();
  if (!Array.isArray(cfg.fieldMap)) throw new Error('Config is missing fieldMap array.');
  return cfg;
}
function renderConfigState() {
  renderPrompts();
  renderQuestionPathOptions();
  renderDefaultRows();
}
async function loadRemoteConfig(url, { preserveDefaultRows = false } = {}) {
  if (!url) throw new Error('Paste a raw GitHub config URL first.');
  const cfg = await fetchRemoteConfig(url);
  activeConfig = cfg;
  if (!preserveDefaultRows) {
    defaultRows = getConfigDefaultRows(cfg);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: cfg, [STORAGE_KEYS.configUrl]: url, [STORAGE_KEYS.defaultRows]: defaultRows });
  renderConfigState();
}
async function loadState() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.config,
    STORAGE_KEYS.configUrl,
    STORAGE_KEYS.responses,
    STORAGE_KEYS.defaultRows,
    STORAGE_KEYS.traceLog,
    STORAGE_KEYS.mode,
    STORAGE_KEYS.discoveryReport,
    STORAGE_KEYS.discoveryPrefix
  ]);
  activeConfig = data[STORAGE_KEYS.config] || window.DEFAULT_ROSE_BPS_CONFIG;
  defaultRows = Array.isArray(data[STORAGE_KEYS.defaultRows]) ? data[STORAGE_KEYS.defaultRows] : getConfigDefaultRows(activeConfig);
  traceLog = Array.isArray(data[STORAGE_KEYS.traceLog]) ? data[STORAGE_KEYS.traceLog] : [];
  activeMode = data[STORAGE_KEYS.mode] || 'bps';
  discoveryReport = data[STORAGE_KEYS.discoveryReport] || null;
  const configUrl = data[STORAGE_KEYS.configUrl] || DEFAULT_REMOTE_CONFIG_URL;
  $('configUrl').value = configUrl;
  $('discoveryPrefix').value = data[STORAGE_KEYS.discoveryPrefix] || '';
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
    const fields = [...document.querySelectorAll(selector)];
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
function pageDiscover(options = {}) {
  try {
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
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        labelledBy.split(/\s+/).forEach(id => {
          const ref = document.getElementById(id);
          if (ref) labels.push(normalize(ref.innerText || ref.textContent));
        });
      }
      return labels.find(Boolean) || '';
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
    const controls = [...document.querySelectorAll(controlSelector)].filter(visible);
    const prefix = slugify(options.pathPrefix || '');
    const sectionCounts = new Map();
    const discovered = controls.map((el, index) => {
      const type = el.tagName === 'TEXTAREA'
        ? 'textarea'
        : el.tagName === 'SELECT'
          ? 'select'
          : el.getAttribute('contenteditable') === 'true'
            ? 'contenteditable'
            : (el.type || 'text').toLowerCase();
      const section = nearestHeading(el) || 'Unsectioned';
      sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
      const label = labelFor(el);
      const contextText = nearbyText(el).slice(0, 260);
      const fallbackName = el.name || el.id || el.placeholder || label || contextText || `${type}_${index + 1}`;
      const basePath = [slugify(section), slugify(label || fallbackName)].filter(Boolean).join('.');
      return {
        index,
        fillIndex: index,
        tag: el.tagName.toLowerCase(),
        type,
        section,
        label,
        id: el.id || '',
        name: el.name || '',
        placeholder: el.placeholder || '',
        required: Boolean(el.required || el.getAttribute('aria-required') === 'true'),
        disabled: Boolean(el.disabled),
        readOnly: Boolean(el.readOnly),
        valuePreview: type === 'checkbox' || type === 'radio' ? Boolean(el.checked) : String(el.value || '').slice(0, 120),
        options: optionText(el),
        suggestedPath: [prefix, basePath || `${type}_${index + 1}`].filter(Boolean).join('.'),
        selectorHints: {
          id: el.id ? `#${el.id}` : '',
          name: el.name ? `[name="${el.name}"]` : '',
          dataQnFieldId: el.getAttribute('data-qn-field-id') || ''
        },
        contextText
      };
    });
    const typeCount = (types) => discovered.filter(control => types.includes(control.type)).length;
    return {
      event: 'discover',
      timestamp: new Date().toISOString(),
      url: location.href,
      title: document.title,
      pathPrefix: options.pathPrefix || '',
      totalControls: discovered.length,
      textLikeCount: typeCount(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'contenteditable', 'search', 'url']),
      checkboxCount: typeCount(['checkbox']),
      radioCount: typeCount(['radio']),
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
      const fallbackName = el.name || el.id || el.placeholder || label || `${type}_${index + 1}`;
      const basePath = [slugify(section), slugify(label || fallbackName)].filter(Boolean).join('.');
      return {
        el,
        index,
        type,
        color: palette[type] || palette.text,
        section,
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
      badge.textContent = `#${control.index} ${control.suggestedPath || control.label || control.type}`;
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
  const dataShapeWarnings = [];
  const hasUsefulMedicationSet = (obj, basePath) => [1, 2, 3].some(i => hasAnyUsefulPath(obj, [
    `${basePath}.medication_${i}.name`,
    `${basePath}.medication_${i}.dosage_frequency`,
    `${basePath}.medication_${i}.side_effects`
  ]));
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
    return normalized;
  };
  merged = normalizeMergedData(merged);
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
    const parentValue = coerce(getPath(obj, choicePath.parentPath));
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
        if (i === 3) set(`${base}.extra_notes`, 'n/a');
      }
    }
    if (!hasAnyUsefulPath(data, ['substance_use.substance_2.age_first_use', 'substance_use.substance_3.age_first_use', 'substance_use.other_substances'])) {
      set('substance_use.other_substances', 'Client reports no other substances used in the past.');
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
    if (choiceIsYes(data, 'mental_health.no_history')) {
      set('mental_health.diagnosis_history', 'n/a');
      set('mental_health.age_diagnosed', 'n/a');
      set('mental_health.using_substances_at_diagnosis', 'n/a');
      set('mental_health.substance_use_impacted_diagnosis', 'n/a');
    } else if (!choiceIsNo(data, 'mental_health.no_history') && hasAnyUsefulPath(data, ['mental_health.diagnosis_history'])) {
      set('mental_health.using_substances_at_diagnosis', 'Client reports they were not using substances at the time of their diagnosis.');
      set('mental_health.substance_use_impacted_diagnosis', 'n/a');
    }
    set('mental_health_treatment.not_interested_in_resources', false);
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
    if (hasUsefulValue(getPath(data, 'spiritual_cultural.religion_affiliation'))) {
      const religion = firstUsefulPathValue(data, ['spiritual_cultural.religion_affiliation']);
      set('spiritual_cultural.active_in_religion', String(religion).trim().toLowerCase() === 'no' ? 'n/a' : 'Yes');
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
    } else if (choiceIsNo(data, 'sexual_history.tested_std_hepatitis_hiv')) {
      set('sexual_history.wants_sexual_health_resources_if_no', 'yes');
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
    const substanceMatch = String(matchedPath || '').match(/^substance_use\.substance_([123])\.age_first_use$/);
    if (!substanceMatch || isBlankLocal(value)) return value;
    const substance = firstUsefulPathValue(merged, [`substance_use.substance_${substanceMatch[1]}.substance`]);
    const text = String(value);
    if (!hasUsefulValue(substance) || /age of first use:/i.test(text)) return value;
    return `${substance}\n\nAge of first use: ${text}`;
  };
  const defaultObj = mergeDefaults(buildRoseRuleDefaults(merged), config.defaultAnswersObject || {});
  const defaultRowPaths = new Set((config.defaultAnswers || []).map(row => String(row.question || '').trim()).filter(Boolean));
  const mappedPaths = new Set();
  (config.fieldMap || []).forEach(item => (item.paths || []).forEach(path => mappedPaths.add(path)));
  const unusedDefaultRows = [...defaultRowPaths].filter(path => !mappedPaths.has(path));
  const findValue = (paths) => {
    const expandedPaths = [...paths];
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
      const fromDefault = coerce(getPath(defaultObj, path));
      if (!isBlankLocal(fromDefault)) return { value: formatValueForField(fromDefault, path), source: 'Rose default answer', matchedPath: path };
    }
    for (const path of expandedPaths) {
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
  const describeElement = (el, fillIndex) => ({
    fillIndex,
    tag: el.tagName,
    type: el.type || '',
    id: el.id || '',
    name: el.name || '',
    className: String(el.className || ''),
    dataQnFieldId: el.getAttribute('data-qn-field-id') || '',
    checked: (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : undefined,
    disabled: Boolean(el.disabled),
    readOnly: Boolean(el.readOnly),
    ariaChecked: el.getAttribute('aria-checked') || '',
    outerHTMLPreview: String(el.outerHTML || '').replace(/\s+/g, ' ').slice(0, 260),
    contextText: String((el.closest('tr, .question, .form-group, label, div') || el.parentElement || el).innerText || '').replace(/\s+/g, ' ').slice(0, 260)
  });
  try {
    const selector = config.selector || 'textarea.qn-textarea, input.qn-editable-cb';
    const fields = [...document.querySelectorAll(selector)];
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
    for (const item of (config.fieldMap || [])) {
      const el = fields[item.fillIndex];
      if (!el) {
        const missing = { action: 'missing_field', fillIndex: item.fillIndex, paths: item.paths || [] };
        result.missing.push(missing);
        result.trace.push(missing);
        continue;
      }
      const before = (el.type || '').toLowerCase() === 'checkbox' ? Boolean(el.checked) : String(el.value || '');
      const foundValue = findValue(item.paths || []);
      const base = {
        ...describeElement(el, item.fillIndex),
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
        if ((el.type || '').toLowerCase() === 'checkbox') {
          checkboxDetails = setCheckboxState(el, checkboxState(valueToWrite));
          finalValue = checkboxDetails.checkedAfterEvents;
        } else {
          el.value = String(valueToWrite);
          finalValue = String(el.value);
          fire(el);
        }
      } else {
        finalValue = (el.type || '').toLowerCase() === 'checkbox' ? checkboxState(valueToWrite) : String(valueToWrite);
        if ((el.type || '').toLowerCase() === 'checkbox') {
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
      result.written++;
      if (foundValue.source === 'Rose default answer') result.defaultWritten++;
      if (foundValue.source === 'BastionGPT response') result.responseWritten++;
      if ((el.type || '').toLowerCase() === 'checkbox') {
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

$('loadRemote').onclick = async () => {
  try {
    const url = $('configUrl').value.trim();
    await loadRemoteConfig(url);
    setStatus('Remote config loaded');
  } catch (err) { setStatus('Config error'); logTo('validation', err.message); }
};
$('useBundled').onclick = async () => {
  activeConfig = window.DEFAULT_ROSE_BPS_CONFIG;
  defaultRows = getConfigDefaultRows(activeConfig);
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: activeConfig, [STORAGE_KEYS.defaultRows]: defaultRows });
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
    const result = await runInActiveTab(pageDiscover, [{ pathPrefix }]);
    if (result?.error) throw new Error(result.error);
    discoveryReport = result;
    await chrome.storage.local.set({ [STORAGE_KEYS.discoveryReport]: discoveryReport });
    renderDiscoveryReport();
    await appendTrace(result);
    setStatus(`Discovered ${result.totalControls} controls`);
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
loadState();
