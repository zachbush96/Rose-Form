import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sidepanelPath = path.join(repoRoot, 'extension', 'sidepanel.js');
const mockFormPath = path.join(repoRoot, 'mockups', 'test-discovery-form.html');
const sidepanelSource = fs.readFileSync(sidepanelPath, 'utf8');
const discoverStart = sidepanelSource.indexOf('async function pageDiscover(options = {})');
const discoverEnd = sidepanelSource.indexOf('function pageFill(config, merged, dryRun)', discoverStart);
const discoverSource = discoverStart === -1 || discoverEnd === -1
  ? ''
  : sidepanelSource.slice(discoverStart, discoverEnd);

if (!discoverSource) {
  throw new Error('Could not extract pageDiscover() from extension/sidepanel.js');
}

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];

async function runDiscovery(url, pathPrefix, options = {}) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return page.evaluate(
    ({ discoverSource, pathPrefix, options }) => {
      // eslint-disable-next-line no-eval
      eval(discoverSource);
      return pageDiscover({ pathPrefix, ...options });
    },
    { discoverSource, pathPrefix, options }
  );
}
async function runVisualMapping(mode, pathPrefix) {
  return page.evaluate(
    ({ discoverSource, mode, pathPrefix }) => {
      // eslint-disable-next-line no-eval
      eval(discoverSource);
      return pageVisualMapping({ action: mode === 'off' ? 'hide' : 'show', mode, pathPrefix });
    },
    { discoverSource, mode, pathPrefix }
  );
}

const localResult = await runDiscovery(pathToFileURL(mockFormPath).href, 'mse');
if (localResult.totalControls !== 12) failures.push(`local discovery expected 12 controls, found ${localResult.totalControls}`);
if (!localResult.sections.some(section => section.name === 'Mental Status Exam' && section.controlCount === 4)) failures.push('local MSE section was not grouped correctly');
if (!localResult.sections.some(section => section.name === 'ASAM Criteria' && section.controlCount === 4)) failures.push('local ASAM section was not grouped correctly');
if (!localResult.sections.some(section => section.name === 'QuickNotes: Mental Health Status Exam Part 2' && section.controlCount === 4)) failures.push('local Part 2 table section was not grouped correctly');
if (!localResult.controls.some(control => control.label === 'Appearance Other' && control.suggestedPath === 'mse.mental_status_exam.appearance_other')) failures.push('local textarea label/path was not discovered');
if (!localResult.controls.some(control => control.type === 'select' && control.options.includes('Euthymic'))) failures.push('local select options were not captured');
if (!localResult.controls.some(control => control.type === 'radio' && control.options.includes('Moderate'))) failures.push('local radio group options were not captured');
if (!localResult.controls.some(control => control.selectorHints.dataQnFieldId === '10371' && control.questionNumber === '1' && control.questionText === 'Perception' && control.answerText === 'Within normal limits' && control.suggestedPath === 'mse.perception.within_normal_limits')) failures.push('local Part 2 table checkbox did not include question context');
if (!localResult.controls.some(control => control.selectorHints.dataQnFieldId === '10376' && control.questionText === 'Perception' && control.suggestedPath === 'mse.perception.other')) failures.push('local Part 2 continuation row did not inherit the question context');
if (!localResult.controls.some(control => control.selectorHints.dataQnFieldId === '10377' && control.questionText === 'Perception' && control.answerText === 'Other text' && control.suggestedPath === 'mse.perception.other_text')) failures.push('local Part 2 wrapped textarea did not inherit the question and wrapper field id');
const deepResult = await runDiscovery(pathToFileURL(mockFormPath).href, 'mse', {
  includeHiddenControls: true,
  capturePageSource: true,
  expandInteractiveSections: true
});
if (deepResult.totalControls !== 13) failures.push(`deep discovery expected 13 controls including collapsed controls, found ${deepResult.totalControls}`);
if (deepResult.hiddenControlCount < 1) failures.push('deep discovery did not report hidden/collapsed controls');
if (!deepResult.controls.some(control => control.id === 'diagnostic_summary' && control.suggestedPath === 'mse.diagnostics_part_4.diagnostic_summary')) failures.push('deep discovery did not capture the collapsed diagnostics textarea');
if (!deepResult.pageSource?.html?.includes('diagnostics-panel')) failures.push('deep discovery did not include full page HTML source');
if (!deepResult.interactiveElements.some(item => item.ariaControls === 'diagnostics-panel')) failures.push('deep discovery did not inventory the diagnostics section button');
if (!deepResult.expansionSnapshots.some(snapshot => snapshot.ariaControls === 'diagnostics-panel' && snapshot.afterVisibleControls === 13)) failures.push('deep discovery did not click through the diagnostics section');
await page.goto(pathToFileURL(mockFormPath).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
const labelsResult = await runVisualMapping('labels', 'mse');
const labelCount = await page.locator('.rose-discovery-map-label').count();
if (labelsResult.controls !== localResult.totalControls) failures.push(`visual labels expected ${localResult.totalControls} controls, found ${labelsResult.controls}`);
if (labelCount !== localResult.totalControls) failures.push(`visual labels expected ${localResult.totalControls} badges, found ${labelCount}`);
const hoverResult = await runVisualMapping('hover', 'mse');
const hoverInitialLabels = await page.locator('.rose-discovery-map-label').count();
if (hoverResult.controls !== localResult.totalControls) failures.push(`hover labels expected ${localResult.totalControls} controls, found ${hoverResult.controls}`);
if (hoverInitialLabels !== 0) failures.push(`hover labels should start hidden until mouseover, found ${hoverInitialLabels} visible badges`);
await page.locator('#appearance_other').hover();
const hoverAfterMouse = await page.locator('.rose-discovery-map-label').count();
if (hoverAfterMouse !== 1) failures.push(`hover labels expected 1 badge after mouseover, found ${hoverAfterMouse}`);
await runVisualMapping('off', 'mse');
const labelCountAfterHide = await page.locator('.rose-discovery-map-label').count();
const layerExistsAfterHide = await page.locator('#rose-discovery-visual-layer').count();
if (labelCountAfterHide !== 0 || layerExistsAfterHide !== 0) failures.push('visual labels were not removed by hide');

let onlineResult = null;
try {
  onlineResult = await runDiscovery('https://www.selenium.dev/selenium/web/web-form.html', 'online_test');
  if (onlineResult.totalControls < 12) failures.push(`online discovery expected at least 12 controls, found ${onlineResult.totalControls}`);
  if (!onlineResult.controls.some(control => /text input/i.test(control.label || control.contextText))) failures.push('online text-input field was not labeled');
  if (!onlineResult.controls.some(control => control.type === 'checkbox' && control.options.some(option => /checked checkbox/i.test(option)))) failures.push('online checkbox options were not captured');
  if (!onlineResult.controls.some(control => control.type === 'radio' && control.options.some(option => /default radio/i.test(option)))) failures.push('online radio options were not captured');
} catch (err) {
  failures.push(`online form discovery failed: ${err.message}`);
}

await browser.close();

console.log(JSON.stringify({
  local: {
    url: localResult.url,
    totalControls: localResult.totalControls,
    sections: localResult.sections,
    firstControls: localResult.controls.slice(0, 4)
  },
  online: onlineResult ? {
    url: onlineResult.url,
    title: onlineResult.title,
    totalControls: onlineResult.totalControls,
    sections: onlineResult.sections,
    firstControls: onlineResult.controls.slice(0, 5)
  } : null,
  failures
}, null, 2));

if (failures.length) process.exit(1);
