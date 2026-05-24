# Troubleshooting

The extension now has a collapsible Troubleshooting trace log at the bottom of the side panel.

## Scan active page

Scan logs:

```text
URL
document title
selector used
fillable field count
bastionGptResponses (all 4 saved response boxes)
first 5 fields
last 5 fields
DOM metadata and surrounding text context
```

Use this before filling a live form. The expected count is 264.

## Fill active page

Fill logs include one trace entry per mapped field:

```text
bastionGptResponses (all 4 saved response boxes)
fillIndex
mapped paths
matched path
source: BastionGPT response, Rose default answer, or blank
DOM tag/type/id/name/class
surrounding context text
previous field value
value written
final value after write
write, dry_run_write, skip_blank, or missing_field action
for checkboxes: requestedChecked, checkedBefore, checkedAfterClick, checkedAfterNativeSetter, checkedAfterEvents, checkboxWriteStrategy, checkboxSetSucceeded, dataQnFieldId, disabled, readOnly, ariaChecked, and outerHTMLPreview
```

The summary also reports:

```text
written
responseWritten
defaultWritten
checkboxWritten
checkboxTrueWritten
checkboxFalseWritten
checkboxWriteFailures
skipped
missingCount
warnings
unusedDefaultRows
```

Checkboxes are written with a click-first strategy so ReliaTrax page handlers see the same event path as a user click. If the click does not reach the requested state, the extension falls back to the native checked setter and records the fallback in the trace.

## Sensitive data warning

Trace logs can contain live client assessment text because they include the data written to the BPS form. Clear logs before sharing screenshots, files, or support notes.

## Discovery and Mapping

Use Discovery and Mapping when a ReliaTrax section is not mapped yet or when Rose needs to send Zach page details. The scanner reads visible controls from the active page and records their DOM order, labels, nearby section headings, id/name hints, checkbox/radio/select options, and suggested JSON paths.

If a report looks wrong:

- Confirm the target form page is the active Chrome tab before clicking `Discover active page`.
- Expand collapsed form sections before scanning. Hidden controls are intentionally skipped.
- Put a short prefix such as `mse`, `asam`, `diagnostics`, or `treatment_plan` in `Suggested path prefix` so copied JSON paths are easier to reuse.
- Click `Show page labels` to draw colored outlines and suggested-path labels directly on the active page.
- Click `Hover labels` when the page is too dense for always-visible labels; the field outline remains visible and the suggested-path label appears when the mouse hovers over the field.
- Click `Hide page labels` before continuing normal form work or taking screenshots that should not include mapping labels.
- Use `Copy email report` for human review and `Copy JSON` when Zach needs exact machine-readable mapping data.
- Clear the report before sharing screenshots if it may contain client text from prefilled fields.

## Remote config says Failed to fetch

This error happens before scanning or filling the ReliaTrax page. The side panel loads the GitHub raw config URL with `fetch()` from `extension/sidepanel.js`. If Chrome cannot reach that URL, the browser raises `Failed to fetch`.

Common causes:

- The machine is offline or on a network that blocks GitHub raw content.
- VPN, firewall, DNS filtering, antivirus, or a managed Chrome profile blocks `raw.githubusercontent.com`.
- The pasted config URL is not a raw GitHub file URL, has a typo, or points to a private file Rose cannot access.
- GitHub raw content is temporarily unavailable from that network.

Quick resolution:

1. Paste the config URL into the same Chrome profile and confirm it opens as JSON.
2. If the URL does not open, switch networks or allow `raw.githubusercontent.com`.
3. If Rose needs to keep working immediately, click `Use bundled config`. The packaged config still contains the prompts and field map.
4. Reload the unpacked extension after updating these files so Chrome picks up the improved error message.
