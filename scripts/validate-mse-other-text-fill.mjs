import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sidepanelPath = path.join(repoRoot, 'extension', 'sidepanel.js');
const sidepanelSource = fs.readFileSync(sidepanelPath, 'utf8');
const fillStart = sidepanelSource.indexOf('function pageFill(config, merged, dryRun)');
const fillEnd = sidepanelSource.indexOf('function buildRuntimeConfig()', fillStart);
const fillSource = fillStart === -1 || fillEnd === -1
  ? ''
  : sidepanelSource.slice(fillStart, fillEnd);

if (!fillSource) throw new Error('Could not extract pageFill() from extension/sidepanel.js');

const html = `<!doctype html>
<html>
<body>
  <table>
    <tbody>
      <tr>
        <td><strong>4.</strong></td>
        <td><strong>Thought Process</strong></td>
        <td><label class="qn-cb-label" for="tp_logical"><input id="tp_logical" type="checkbox" class="qn-editable-cb" checked> Logical</label></td>
        <td><label class="qn-cb-label" for="tp_circ"><input id="tp_circ" type="checkbox" class="qn-editable-cb"> Circumstantial</label></td>
      </tr>
      <tr>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td><label class="qn-cb-label" for="tp_other"><input id="tp_other" type="checkbox" class="qn-editable-cb">&nbsp;Other:</label></td>
        <td class="qn-editable textarea-wrapper"><textarea id="tp_other_text" class="qn-textarea"></textarea></td>
      </tr>
      <tr>
        <td><strong>3.</strong></td>
        <td><strong>Insight</strong></td>
        <td><label class="qn-cb-label" for="insight_normal"><input id="insight_normal" type="checkbox" class="qn-editable-cb" checked> Within normal limits</label></td>
        <td><label class="qn-cb-label" for="insight_other"><input id="insight_other" type="checkbox" class="qn-editable-cb">&nbsp;Other:</label></td>
        <td class="qn-editable textarea-wrapper"><textarea id="insight_other_text" class="qn-textarea"></textarea></td>
      </tr>
      <tr>
        <td><strong>4.</strong></td>
        <td><strong>Judgment</strong></td>
        <td><label class="qn-cb-label" for="judgment_normal"><input id="judgment_normal" type="checkbox" class="qn-editable-cb" checked> Within normal limits</label></td>
        <td><label class="qn-cb-label" for="judgment_other"><input id="judgment_other" type="checkbox" class="qn-editable-cb">&nbsp;Other:</label></td>
        <td class="qn-editable textarea-wrapper"><textarea id="judgment_other_text" class="qn-textarea"></textarea></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];

await page.setContent(html, { waitUntil: 'domcontentloaded' });
const result = await page.evaluate(
  ({ fillSource }) => {
    // eslint-disable-next-line no-eval
    eval(fillSource);
    return pageFill({
      workflowMode: 'mse',
      selector: 'input.qn-editable-cb, textarea.qn-textarea',
      onlyVisibleControls: false,
      expectedFieldCount: 10,
      fieldMap: [
        { fillIndex: 0, paths: ['mse.items.thought_process.selections.Logical'] },
        { fillIndex: 1, paths: ['mse.items.thought_process.selections.Circumstantial'] },
        { fillIndex: 2, paths: ['mse.items.thought_process.selections.Other'] },
        { fillIndex: 3, paths: ['mse.items.thought_process.other_text', 'mse.items.thought_process.narrative'] },
        { fillIndex: 4, paths: ['mse.items.insight.selections.Within normal limits'] },
        { fillIndex: 5, paths: ['mse.items.insight.selections.Other'] },
        { fillIndex: 6, paths: ['mse.items.insight.other_text', 'mse.items.insight.narrative'] },
        { fillIndex: 7, paths: ['mse.items.judgment.selections.Within normal limits'] },
        { fillIndex: 8, paths: ['mse.items.judgment.selections.Other'] },
        { fillIndex: 9, paths: ['mse.items.judgment.other_text', 'mse.items.judgment.narrative'] }
      ],
      defaultAnswers: [],
      defaultAnswersObject: {
        mse: {
          items: {
            thought_process: { selections: { Logical: true } },
            insight: { selections: { 'Within normal limits': true } },
            judgment: { selections: { 'Within normal limits': true } }
          }
        }
      }
    }, {
      mse: {
        items: {
          thought_process: {
            selections: ['Logical'],
            other_text: 'Larry demonstrates circumstantial and paranoid thinking.'
          },
          insight: {
            selections: ['Within normal limits'],
            other_text: 'John demonstrates fair insight with partial acknowledgment of his substance use concerns.'
          },
          judgment: {
            other_text: 'John demonstrates fair judgment with some poor follow-through around treatment recommendations.'
          }
        }
      }
    }, false);
  },
  { fillSource }
);

const state = await page.evaluate(() => ({
  thoughtLogical: document.querySelector('#tp_logical').checked,
  thoughtOther: document.querySelector('#tp_other').checked,
  thoughtText: document.querySelector('#tp_other_text').value,
  insightNormal: document.querySelector('#insight_normal').checked,
  insightOther: document.querySelector('#insight_other').checked,
  insightText: document.querySelector('#insight_other_text').value,
  judgmentNormal: document.querySelector('#judgment_normal').checked,
  judgmentOther: document.querySelector('#judgment_other').checked,
  judgmentText: document.querySelector('#judgment_other_text').value
}));

await browser.close();

if (result?.error) failures.push(result.error);
if (state.thoughtText !== 'Larry demonstrates circumstantial and paranoid thinking.') failures.push('thought process textarea was not filled');
if (state.thoughtOther !== true) failures.push('Thought Process Other checkbox was not checked for nonblank text field');
if (state.thoughtLogical !== false) failures.push('Thought Process Logical checkbox was not cleared when text field forced Other');
if (state.insightText !== 'John demonstrates fair insight with partial acknowledgment of his substance use concerns.') failures.push('insight textarea was not filled');
if (state.insightOther !== true) failures.push('Insight Other checkbox was not checked for nonblank text field');
if (state.insightNormal !== false) failures.push('Insight Within normal limits checkbox was not cleared when text field forced Other');
if (state.judgmentText !== 'John demonstrates fair judgment with some poor follow-through around treatment recommendations.') failures.push('judgment textarea was not filled');
if (state.judgmentOther !== true) failures.push('Judgment Other checkbox was not checked for nonblank text field');
if (state.judgmentNormal !== false) failures.push('Judgment Within normal limits checkbox was not cleared when text field forced Other');
if (!result?.trace?.some(row => row.action === 'linked_other_checkbox_write')) failures.push('trace did not record linked Other checkbox write');
const normalFalseWrites = (result?.trace || []).filter(row =>
  [0, 4, 7].includes(row.fillIndex) &&
  (row.action === 'write' || row.action === 'linked_normal_checkbox_clear') &&
  row.finalValue === false
);
if (normalFalseWrites.length < 3) failures.push('trace did not record all normal/default checkboxes being cleared or written false');

console.log(JSON.stringify({ state, result, failures }, null, 2));
if (failures.length) process.exit(1);
