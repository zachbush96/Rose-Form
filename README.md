# Rose ReliaTrax BPS Helper

Functional MV3 Chrome extension prototype for Rose's ReliaTrax BPS workflow.

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

1. Open `mockups/test-reliatrax-bps.html` in Chrome.
2. Open the extension side panel.
3. Paste JSON into the four response boxes or use `github-data/sample-empty-combined-response.json` as a reference.
4. Review or edit Rose default answers.
5. Click Validate and merge.
6. Click Scan active page and confirm it finds 264 fields.
7. Click Fill active page.
8. Confirm the result writes response values plus Rose rule/default values.
9. Open the Troubleshooting trace log at the bottom to inspect exact writes.

## Notes

The ReliaTrax page uses DOM order rather than friendly field names. The selector is:

```js
textarea.qn-textarea, input.qn-editable-cb
```

Expected fillable controls: 264.

Education, Military, and Current Marital Status include Rose's repurposed-field mappings and runtime defaults.

Trace logs can contain client assessment data. Clear logs before sharing screenshots or exporting results.
