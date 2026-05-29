# Default Answers

Version 0.4.2 supports full Rose-rule prompts, built-in Rose rules, and editable default answers in the extension side panel.

The built-in rules apply the defaults, inference-sensitive follow-ups, and repurposed-field behavior from `reference/rose-source-prompts/Rose_instructions.txt`, including lowercase `n/a`, common checkbox defaults, substance-name plus age formatting, unused substance follow-ups, risk/medical/relationship/CPS conditional follow-ups, medication defaults, sexual health defaults, military `n/a` handling, and Prompt 4 aliases.

For Withdrawal History, if the client has any withdrawal history and does not specify timing, "How long after your last use did these symptoms begin?" defaults to `Several hours after cessation of use`. "How long did your symptoms last?" defaults to `Reports symptoms lasting approximately one week`, except marijuana defaults to `Reports symptoms lasting approximately 2-3 days`.

For medications, empty Medication #1 through #3 slots write `n/a` to the text fields and leave all medication checkboxes unchecked. Prompt 3 should prioritize substance-use and mental-health medications before other prescribed/current medications, and should not list vitamins or supplements.

## GitHub brain format

Use `defaultAnswers` in `github-data/rose-reliatrax-bps-config.json`:

```json
{
  "defaultAnswers": [
    {
      "question": "educational.liked_school_when_younger",
      "answer": "Client reports school was generally okay."
    },
    {
      "question": "military.active_duty",
      "answer": "n/a"
    },
    {
      "question": "sexual_history.practices_safe_sex.sometimes",
      "answer": true
    }
  ]
}
```

## How the extension uses them

1. The extension applies built-in Rose rules during Fill active page.
2. The remote GitHub config can seed the editable default answers table.
3. Rose can manually add, edit, or remove rows in the extension.
4. Local edits are saved in `chrome.storage.local`.
5. During Fill active page, BastionGPT response values are used first.
6. Built-in rules and editable default answers fill mapped questions when the BastionGPT response is blank or missing.

## Question column

The Question column should be a field path from the field map, such as:

```text
military.active_duty
educational.clubs_or_sports
current_marital_status_and_living_environment.recovery_support_people
```

For checkbox groups, use the exact leaf path for the checkbox you want to set:

```text
sexual_history.practices_safe_sex.yes
sexual_history.practices_safe_sex.no
sexual_history.practices_safe_sex.sometimes
```

Then use `true` or `false` in the Answer column.
