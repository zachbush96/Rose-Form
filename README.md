# Rose ReliaTrax BPS Helper

Functional MV3 Chrome extension prototype for Rose's ReliaTrax BPS workflow and upcoming mapped sections.

## What this contains

```text
extension/                       Load this as an unpacked Chrome extension
github-data/                     Upload this folder's JSON/text files to GitHub
github-data/rose-reliatrax-workflows-config.json
                                 Mode descriptions, source prompts, and per-mode remote URLs
github-data/rose-quicknotes-config.json
                                 QuickNotes prompt and 272-control fill map
github-data/rose-quicknotes-discovery-2026-05-25.json
                                 Rose's latest Group Notes discovery JSON from Gmail
mockups/test-reliatrax-bps.html  Local 264-field test form
fixtures/bps/                    Captured BPS ReliaTrax page used by automated tests
fixtures/mse-part-2/             MSE Part 2 form snapshots, exported JSON, and question body HTML
fixtures/quicknotes/             QuickNotes discovery reports, including TXT files with report content
fixtures/responses/              Sample structured JSON responses used by validators
reference/rose-source-prompts/   Rose-provided source prompt emails and automation instructions
reference/clinical-examples/     Golden examples and captured clinical response/debug payloads
notes/YYYY-MM-DD/                Dated project notes and implementation reminders
docs/field-map.md                Human-readable field map summary
docs/default-answers.md          Default answer setup notes
docs/troubleshooting.md          Trace log and debugging notes
docs/rose-latest-email-alignment-2026-05-26.md
                                 Rose's newest Gmail prompt sources and project alignment notes
scripts/                         Original bookmarklet artifact
```

Loose evidence files are grouped by what they contain, not by extension. For example, `fixtures/quicknotes/P2_JSON.txt` is a discovery report even though it is a TXT file, and `reference/clinical-examples/Medications&MH.txt` contains JSON-like trace payloads used for debugging medication and mental-health fill behavior.

## Install

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select the `extension/` folder.
5. Click the extension icon to open the side panel.

## GitHub config

Upload the JSON files in `github-data/` to the GitHub repo used by the raw URLs. Use the BPS Raw URL in the extension under Remote config.

The extension fetches config, prompts, default answers, workflow mode metadata, and field mapping as data. `Load remote config` refreshes the BPS config URL, the workflow config for Part 2 / Part 3 / Part 4 / Treatment Plan prompts and mapping status, and the QuickNotes mapping config. It does not execute remote JavaScript.

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
3. Paste JSON into the four response boxes or use `github-data/sample-empty-combined-response.json` or `fixtures/responses/example_JSON.json` as a reference.
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

The side panel now has seven modes:

- BPS Part 1
- MSE Part 2
- Case Management and ASAM Part 3
- Diagnostics Part 4
- Treatment Plan
- QuickNotes / Group Notes
- Discovery and Mapping

Active fill workflows today are BPS Part 1, MSE Part 2, and QuickNotes / Group Notes. Discovery and Mapping is active for scan/export work. MSE Part 2 has its own screenshot-aligned JSON prompt, response validation, scan, and mapped fill behavior for the visible MSE rows from Appearance through Judgment. Case Management and ASAM Part 3, Diagnostics Part 4, and Treatment Plan carry Rose's latest emailed source prompts as copyable references until their field maps are built.

Rose's latest Gmail prompt-source alignment is summarized in `docs/rose-latest-email-alignment-2026-05-26.md`. The pending-mode source prompts, mapping status, and future `fieldMap` arrays live in `github-data/rose-reliatrax-workflows-config.json`; `extension/workflow-config.js` is the bundled fallback copy for offline extension use. The side panel reads those config objects and exposes source prompts with copy buttons. MSE Part 2 uses `Copy prompt` and a saved JSON response box so Rose can run the prompt and verify every visible MSE row from Appearance through Judgment beside the eventual fill controls.

QuickNotes / Group Notes is now active for Rose's 2026-05-25 emailed discovery map. It uses `github-data/rose-quicknotes-config.json` as the GitHub-hosted config source, with `extension/quicknotes-config.js` as the bundled fallback, and expects 272 visible controls on the ReliaTrax Group Notes page.

Use the QuickNotes mode by pasting one JSON object into the QuickNotes response box. The JSON can use either the friendly suggested paths from the field map or stable index paths such as:

```json
{
  "quicknotes": {
    "controls": {
      "3": "Self-referral",
      "267": true
    }
  }
}
```

For checkboxes and radio buttons, use `true` for the option to select.

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
