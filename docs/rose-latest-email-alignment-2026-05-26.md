# Rose Latest Email Alignment - 2026-05-26

Rose's newest Gmail messages from May 25, 2026 add current BastionGPT source prompts and form screenshots for the next ReliaTrax sections. The extension now treats these as source guidance for the placeholder modes, while BPS Part 1 and QuickNotes remain the active fill workflows.

## Gmail Sources

- `19e62244b6e326bf` - `Pt 2 form screenshot and current prompt` - 2026-05-25 9:36 PM Central
- `19e6226123de9ae7` - `Pt 3 form screenshot and current prompts (prompt 1 for the #s, second prompt for ASAMs)` - 2026-05-25 9:38 PM Central
- `19e62280dbcee9a0` - `pt 4 prompt and screenshots - Note: top 4 questions/scores at top or this form can be ignored, I will fill in` - 2026-05-25 9:40 PM Central
- `19e61d49faa67cd2` / `19e61d4c50642870` - `Re: part two: mental health status exam rules` - 2026-05-25 8:09 PM Central, including the QuickNotes / Group Notes discovery report already represented by `github-data/rose-quicknotes-discovery-2026-05-25.json`

## Project Alignment

- BPS Part 1: still uses `github-data/rose-reliatrax-bps-config.json` and `extension/default-config.js` for four structured JSON extraction prompts and the 264-field BPS map.
- Workflow modes: source prompt text, mode descriptions, mapping status, future `fieldMap` arrays, and per-mode remote config URLs now live in `github-data/rose-reliatrax-workflows-config.json`, with `extension/workflow-config.js` as the bundled fallback for the side panel.
- QuickNotes / Group Notes: active mode remains based on `github-data/rose-quicknotes-config.json`, `extension/quicknotes-config.js`, and the 272-control discovery snapshot Rose emailed.
- MSE Part 2: source prompt now reflects Rose's phone-assessment MSE rules, conservative inference, required individual MSE items, and Other-with-narrative behavior. It returns structured JSON for all screenshot rows from Appearance through Judgment so missing rows are visible during validation.
- Case Management and ASAM Part 3: source prompt now reflects the separate case-management scoring grid and the ASAM six-dimension prompt/rating requirements.
- Diagnostics Part 4: source prompt now reflects screening results, assessment summary, clinical recommendations, SUD-only DSM V, level-of-care, and discharge-date rules.
- Treatment Plan: source prompt remains based on Rose's emailed treatment plan rules from May 23, 2026.

## Implementation Boundary

The new emails do not provide a completed field map for Part 2, Part 3, Part 4, or Treatment Plan. Those modes therefore expose copyable source prompts/notes from the workflow config and keep the mode marked as pending field mapping with empty remote-owned `fieldMap` arrays. This avoids routing free-text/current-prompt output into the existing BPS Part 1 JSON map and keeps prompt/config data out of `extension/sidepanel.js`.
