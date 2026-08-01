# Treatment Plan implementation audit

Audit date: 2026-07-28

## Source scope

This audit treats Rose's two newest feature-request emails as the current scope:

- `Treatment Plan Prompts (4)`, received 2026-07-26 at 8:24 PM Mountain, Gmail message `19fa163fd2ce7c84`
- `Treatment Plan Blank / Examples`, received 2026-07-26 at 8:33 PM Mountain, Gmail message `19fa16bd997e6035`

The four clinical prompt bodies in `rose-treatment-plan-config.json` and the bundled `extension/treatment-config.js` were compared with the source email and matched exactly. The extension appends a shared JSON-only output contract when displaying or copying a prompt; Rose's original clinical content remains unchanged and separately identifiable.

## Implemented

- Four selectable scenarios: SUD outpatient/IOP, detox first, ASAM 3.7, and non-SUD referral out.
- Mandatory JSON-only output using the same structured response pattern as the earlier extension sections.
- Remote GitHub prompt loading with a bundled offline fallback.
- Copy controls for the selected prompt and source-noted prompt.
- Parsing of structured Treatment Plan JSON, including three problems, objective/intervention arrays, scenario-specific timeframes, safety planning, and Next Review Date. The prior formatted-text parser remains available as a fallback.
- Warning-level scenario checks for required goal frameworks, target/completion dates, Next Review Date, ASAM 3.7 language, detox medical necessity, and forbidden wording.
- Stable `data-qn-field-id` mapping for editable Service Plan fields `10000` through `10024`, scoped to the active note panel so similarly numbered fields elsewhere on Group Notes cannot be selected.
- Static Date of Service Plan capture for Assessment Date, including the live form layout where the service-plan date is rendered as read-only text rather than an input.
- Read-only Next Review comparison with a mismatch warning. The extension never writes that static value and never treats the `10025`/`10026` Client accepted/denied checkboxes as Next Review.
- A support bundle that captures controls, labels, DOM hints, page metadata, response coverage, and recent traces for stable mapping.

## Assumptions and pivot points

- "Most recent emails" means the two July 26 Treatment Plan emails, not older BPS Part 1-4 troubleshooting threads.
- Rose's prompt-specific Next Review instructions remain authoritative, while the examples' prefilled 180-day field is preserved until Rose answers the clarification. This is warning-level behavior and can be changed without altering the prompt bodies.
- The JSON output contract is stored once in `outputFormat.instructions` and appended at copy time. It can be revised or removed without editing Rose's four clinical prompt bodies.
- The 2026-07-28 authenticated support capture established stable editable field IDs `10000`-`10024`. The full active Service Plan exposes 27 scoped controls because `10025` and `10026` are the two client-copy checkboxes; those checkboxes are intentionally not mapped.
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
