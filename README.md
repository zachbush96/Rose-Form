# Rose ReliaTrax BPS Helper

Functional MV3 Chrome extension prototype for Rose's ReliaTrax BPS workflow and upcoming mapped sections.

## What this contains

```text
extension/                       Load this as an unpacked Chrome extension
github-data/                     Upload this folder's JSON/text files to GitHub
mockups/test-reliatrax-bps.html  Local 264-field test form
docs/field-map.md                Human-readable field map summary
docs/default-answers.md          Default answer setup notes
docs/troubleshooting.md          Trace log and debugging notes
scripts/                         Original bookmarklet artifact
```

## Install

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select the `extension/` folder.
5. Click the extension icon to open the side panel.

## GitHub config

Upload `github-data/rose-reliatrax-bps-config.json` to a GitHub repo. Use the Raw URL in the extension under Remote config.

The extension fetches config, prompts, default answers, and field mapping as data. It does not execute remote JavaScript.

## Rose rules and default answers

Version 0.4.1 applies Rose's built-in BPS rules during Fill active page, including fixed defaults, lowercase `n/a` follow-ups, substance-name plus age formatting, repurposed field aliases, and checkbox choice mapping. Checkbox writes use a click-first path with a native setter fallback and trace counters for accepted checkbox state.

The side panel also includes an editable default answers table for local overrides or extra site-specific defaults. The GitHub brain can seed this section from:

```json
"defaultAnswers": [
  { "question": "military.active_duty", "answer": "n/a" }
]
```

Rose can add, edit, or remove rows locally. Local edits are saved in Chrome storage and are used during Fill active page after the built-in Rose rules. Loading a remote config again resets the local table to whatever is in the remote brain.

For checkbox fields, set the mapped checkbox leaf path to `true` or `false`, for example:

```json
{ "question": "sexual_history.practices_safe_sex.sometimes", "answer": true }
```

## Test

### BPS fill regression

1. Open `mockups/test-reliatrax-bps.html` in Chrome.
2. Open the extension side panel.
3. Paste JSON into the four response boxes or use `github-data/sample-empty-combined-response.json` as a reference.
4. Review or edit Rose default answers.
5. Click Validate and merge.
6. Click Scan active page and confirm it finds 264 fields.
7. Click Fill active page.
8. Confirm the result writes response values plus Rose rule/default values.
9. Open the Troubleshooting trace log at the bottom to inspect exact writes.

Run the automated BPS regression with:

```bash
node scripts/validate-saved-form.mjs
```

### Discovery and Mapping

The side panel now has six modes:

- BPS Part 1
- MSE Part 2
- Case Management and ASAM Part 3
- Diagnostics Part 4
- Treatment Plan
- Discovery and Mapping

Only BPS Part 1 and Discovery and Mapping are active fill workflows today. The other modes are placeholders for the next mapped sections.

Use Discovery and Mapping on an unknown ReliaTrax page before building a new section map:

1. Open the target form page.
2. Open the extension side panel.
3. Select Discovery and Mapping.
4. Enter a suggested prefix such as `mse`, `asam`, `diagnostics`, or `treatment_plan`.
5. Click Discover active page.
6. Click Show page labels to draw colored labels on the active form, or Hover labels to show labels only while the mouse is over a control.
7. Click Hide page labels when the visual overlay is no longer needed.
8. Click Copy email report or Copy JSON to send the mapping inventory.

The discovery report includes page URL, title, form section groups, control order, labels, id/name hints, options, required/disabled/read-only state, context text, and suggested JSON paths.
The visual mapping overlay uses the same scanner and shows each control's discovery index plus suggested JSON path directly on the real page.

Run the automated discovery regression with:

```bash
node scripts/validate-discovery-mapping.mjs
```

## Notes

The ReliaTrax page uses DOM order rather than friendly field names. The selector is:

```js
textarea.qn-textarea, input.qn-editable-cb
```

Expected fillable controls: 264.

Education, Military, and Current Marital Status include Rose's repurposed-field mappings and runtime defaults.

Trace logs can contain client assessment data. Clear logs before sharing screenshots or exporting results.
