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
