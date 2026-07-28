# Treatment Plan implementation audit

Audit date: 2026-07-28

## Source scope

This audit treats Rose's two newest feature-request emails as the current scope:

- `Treatment Plan Prompts (4)`, received 2026-07-26 at 8:24 PM Mountain, Gmail message `19fa163fd2ce7c84`
- `Treatment Plan Blank / Examples`, received 2026-07-26 at 8:33 PM Mountain, Gmail message `19fa16bd997e6035`

The four prompt bodies in `rose-treatment-plan-config.json` and the bundled `extension/treatment-config.js` were compared with the source email and matched exactly.

## Implemented

- Four selectable scenarios: SUD outpatient/IOP, detox first, ASAM 3.7, and non-SUD referral out.
- Remote GitHub prompt loading with a bundled offline fallback.
- Copy controls for the selected prompt and source-noted prompt.
- Parsing of Rose's formatted response, including three problems, numbered objectives/interventions, scenario-specific timeframe headings, safety planning, and Next Review Date.
- Warning-level scenario checks for required goal frameworks, target/completion dates, Next Review Date, ASAM 3.7 language, detox medical necessity, and forbidden wording.
- Date of Service Plan capture for Assessment Date, with a warning when the two live form dates disagree.
- Label- and section-aware dry-run/fill for the fields shown in Rose's screenshots.
- Preservation of an existing Next Review value, with a mismatch warning instead of an overwrite.
- A support bundle that captures controls, labels, DOM hints, page metadata, response coverage, and recent traces for stable mapping.

## Assumptions and pivot points

- "Most recent emails" means the two July 26 Treatment Plan emails, not older BPS Part 1-4 troubleshooting threads.
- Rose's prompt-specific Next Review instructions remain authoritative, while the examples' prefilled 180-day field is preserved until Rose answers the clarification. This is warning-level behavior and can be changed without altering the prompt bodies.
- The current adaptive field matcher is designed from Rose's screenshots and examples. Stable ReliaTrax field IDs still require an authenticated live-page support capture. Until that capture is incorporated, use Dry run first and review every matched/missing field.
- No email attachments or client records are stored in this repository.

## Verification

Run:

```sh
node --test extension/tests/treatment-plan.test.cjs
node --check extension/sidepanel.js
node --check extension/treatment-config.js
python3 -m json.tool github-data/rose-treatment-plan-config.json >/dev/null
git diff --check
```
