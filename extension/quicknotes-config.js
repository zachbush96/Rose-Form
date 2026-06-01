window.DEFAULT_ROSE_QUICKNOTES_CONFIG = {
  "project": "Rose ReliaTrax QuickNotes Automation",
  "version": "0.1.0",
  "updated": "2026-05-25",
  "sourceEmail": {
    "from": "Provider (redacted)",
    "subject": "Re: part two: mental health status exam rules",
    "messageId": "redacted",
    "timestamp": "2026-05-25T21:09:37-04:00"
  },
  "discoverySnapshot": "github-data/rose-quicknotes-discovery-2026-05-25.json",
  "selector": "textarea, select, input:not([type=\"hidden\"]):not([type=\"submit\"]):not([type=\"button\"]):not([type=\"reset\"]):not([type=\"image\"]), [contenteditable=\"true\"]",
  "onlyVisibleControls": true,
  "expectedFieldCount": 272,
  "defaultsOverwriteExisting": true,
  "prompts": [
    {
      "id": "quicknotes",
      "title": "QuickNotes / Group Notes JSON",
      "body": "Return valid JSON only for the Rose ReliaTrax QuickNotes / Group Notes form. Use the field paths from the bundled QuickNotes field map. For every field you can answer, set either the friendly suggestedPath or the stable quicknotes.controls.<index> key. For checkbox and radio choices, return true only for the option that should be selected and false or omit the rest. Use concise clinical full sentences for textareas."
    }
  ],
  "fieldMap": [
    {
      "fillIndex": 0,
      "paths": [
        "unsectioned.clientsearch",
        "quicknotes.controls.0"
      ],
      "label": "",
      "contextText": "client search: ˅",
      "type": "text",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": "[name=\"clientSearch\"]"
      }
    },
    {
      "fillIndex": 1,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.date",
        "quicknotes.controls.1"
      ],
      "label": "",
      "contextText": "Provider change Date: Notes for the full week will be loaded.",
      "type": "text",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#date",
        "name": "[name=\"date\"]"
      }
    },
    {
      "fillIndex": 2,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.doccategoryid",
        "quicknotes.controls.2"
      ],
      "label": "",
      "contextText": "Session Notes Contract Intake",
      "type": "select",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#DocCategoryID",
        "name": "[name=\"DocCategoryID\"]"
      }
    },
    {
      "fillIndex": 3,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.who_referred_you_to_services",
        "quicknotes.controls.3"
      ],
      "label": "",
      "contextText": "Who referred you to services?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 4,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.tell_me_a_bit_about_why_you_decided_to_our_services",
        "quicknotes.controls.4"
      ],
      "label": "",
      "contextText": "Tell me a bit about why you decided to our services?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 5,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.where_are_you_currently_living_is_this_the_same_or_different_tha",
        "quicknotes.controls.5"
      ],
      "label": "",
      "contextText": "Where are you currently living? (Is this the same or different than their current location?)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 6,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.with_whom_are_you_living",
        "quicknotes.controls.6"
      ],
      "label": "",
      "contextText": "With whom are you living?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 7,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.check_if_no_history_of_substance_use",
        "quicknotes.controls.7"
      ],
      "label": "Check if NO history of substance use",
      "contextText": "Check if NO history of substance use",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10004",
        "id": "#cb-10004",
        "name": ""
      }
    },
    {
      "fillIndex": 8,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.age_of_first_use",
        "quicknotes.controls.8"
      ],
      "label": "",
      "contextText": "Age of first use:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 9,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.in_general_how_much_were_you_using",
        "quicknotes.controls.9"
      ],
      "label": "",
      "contextText": "In general, how much were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 10,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_often_were_you_using",
        "quicknotes.controls.10"
      ],
      "label": "",
      "contextText": "How often were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 11,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.at_any_point_of_your_use_did_you_develop_a_tolerance",
        "quicknotes.controls.11"
      ],
      "label": "",
      "contextText": "At any point of your use did you develop a tolerance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 12,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_method_of_use_smoking_injecting_nasal_etc",
        "quicknotes.controls.12"
      ],
      "label": "",
      "contextText": "What was the method of use (smoking, injecting, nasal, etc.)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 13,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_date_of_last_use",
        "quicknotes.controls.13"
      ],
      "label": "",
      "contextText": "What was the date of last use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 14,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_days_in_the_last_30_days_did_you_use",
        "quicknotes.controls.14"
      ],
      "label": "",
      "contextText": "How many days in the last 30 days did you use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 15,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_your_most_recent_pattern_of_use_and_how_long_has_this_pa",
        "quicknotes.controls.15"
      ],
      "label": "",
      "contextText": "What is your most recent pattern of use and how long has this pattern been occurring?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 16,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_you_notice_any_behavioral_changes_in_yourself_when_using_thi",
        "quicknotes.controls.16"
      ],
      "label": "",
      "contextText": "Did you notice any behavioral changes in yourself when using this substance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 17,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_were_the_consequences_to_using_this_substance_impacts_on_re",
        "quicknotes.controls.17"
      ],
      "label": "",
      "contextText": "What were the consequences to using this substance? (Impacts on relationships/employment/health- physical or mental/legal problems)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 18,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.18"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10015",
        "id": "#cb-10015",
        "name": ""
      }
    },
    {
      "fillIndex": 19,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.19"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10016",
        "id": "#cb-10016",
        "name": ""
      }
    },
    {
      "fillIndex": 20,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.20"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10017",
        "id": "#cb-10017",
        "name": ""
      }
    },
    {
      "fillIndex": 21,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.21"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10018",
        "id": "#cb-10018",
        "name": ""
      }
    },
    {
      "fillIndex": 22,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_long_were_you_sober",
        "quicknotes.controls.22"
      ],
      "label": "",
      "contextText": "How long were you sober?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 23,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.age_of_first_use",
        "quicknotes.controls.23"
      ],
      "label": "",
      "contextText": "Age of first use:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 24,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.in_general_how_much_were_you_using",
        "quicknotes.controls.24"
      ],
      "label": "",
      "contextText": "In general, how much were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 25,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_often_were_you_using",
        "quicknotes.controls.25"
      ],
      "label": "",
      "contextText": "How often were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 26,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.at_any_point_of_your_use_did_you_develop_a_tolerance",
        "quicknotes.controls.26"
      ],
      "label": "",
      "contextText": "At any point of your use did you develop a tolerance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 27,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_method_of_use_smoking_injecting_nasal_etc",
        "quicknotes.controls.27"
      ],
      "label": "",
      "contextText": "What was the method of use (smoking, injecting, nasal, etc.)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 28,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_date_of_last_use",
        "quicknotes.controls.28"
      ],
      "label": "",
      "contextText": "What was the date of last use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 29,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_days_in_the_last_30_days_did_you_use",
        "quicknotes.controls.29"
      ],
      "label": "",
      "contextText": "How many days in the last 30 days did you use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 30,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_your_most_recent_pattern_of_use_and_how_long_has_this_pa",
        "quicknotes.controls.30"
      ],
      "label": "",
      "contextText": "What is your most recent pattern of use and how long has this pattern been occurring?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 31,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_you_notice_any_behavioral_changes_in_yourself_when_using_thi",
        "quicknotes.controls.31"
      ],
      "label": "",
      "contextText": "Did you notice any behavioral changes in yourself when using this substance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 32,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_were_the_consequences_to_using_this_substance_impacts_on_re",
        "quicknotes.controls.32"
      ],
      "label": "",
      "contextText": "What were the consequences to using this substance? (Impacts on relationships/employment/health- physical or mental/legal problems)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 33,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.33"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10030",
        "id": "#cb-10030",
        "name": ""
      }
    },
    {
      "fillIndex": 34,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.34"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10031",
        "id": "#cb-10031",
        "name": ""
      }
    },
    {
      "fillIndex": 35,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.35"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10032",
        "id": "#cb-10032",
        "name": ""
      }
    },
    {
      "fillIndex": 36,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.36"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10033",
        "id": "#cb-10033",
        "name": ""
      }
    },
    {
      "fillIndex": 37,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_long_were_you_sober",
        "quicknotes.controls.37"
      ],
      "label": "",
      "contextText": "How long were you sober?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 38,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.substance",
        "quicknotes.controls.38"
      ],
      "label": "",
      "contextText": "Substance:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 39,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.age_of_first_use",
        "quicknotes.controls.39"
      ],
      "label": "",
      "contextText": "Age of first use:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 40,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.in_general_how_much_were_you_using",
        "quicknotes.controls.40"
      ],
      "label": "",
      "contextText": "In general, how much were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 41,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_often_were_you_using",
        "quicknotes.controls.41"
      ],
      "label": "",
      "contextText": "How often were you using?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 42,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.at_any_point_of_your_use_did_you_develop_a_tolerance",
        "quicknotes.controls.42"
      ],
      "label": "",
      "contextText": "At any point of your use did you develop a tolerance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 43,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_method_of_use_smoking_injecting_nasal_etc",
        "quicknotes.controls.43"
      ],
      "label": "",
      "contextText": "What was the method of use (smoking, injecting, nasal, etc.)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 44,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_the_date_of_last_use",
        "quicknotes.controls.44"
      ],
      "label": "",
      "contextText": "What was the date of last use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 45,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_days_in_the_last_30_days_did_you_use",
        "quicknotes.controls.45"
      ],
      "label": "",
      "contextText": "How many days in the last 30 days did you use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 46,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_your_most_recent_pattern_of_use_and_how_long_has_this_pa",
        "quicknotes.controls.46"
      ],
      "label": "",
      "contextText": "What is your most recent pattern of use and how long has this pattern been occurring?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 47,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_you_notice_any_behavioral_changes_in_yourself_when_using_thi",
        "quicknotes.controls.47"
      ],
      "label": "",
      "contextText": "Did you notice any behavioral changes in yourself when using this substance?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 48,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_were_the_consequences_to_using_this_substance_impacts_on_re",
        "quicknotes.controls.48"
      ],
      "label": "",
      "contextText": "What were the consequences to using this substance? (Impacts on relationships/employment/health- physical or mental/legal problems)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 49,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.49"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10046",
        "id": "#cb-10046",
        "name": ""
      }
    },
    {
      "fillIndex": 50,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.50"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10047",
        "id": "#cb-10047",
        "name": ""
      }
    },
    {
      "fillIndex": 51,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.51"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10048",
        "id": "#cb-10048",
        "name": ""
      }
    },
    {
      "fillIndex": 52,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.52"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10049",
        "id": "#cb-10049",
        "name": ""
      }
    },
    {
      "fillIndex": 53,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_long_were_you_sober",
        "quicknotes.controls.53"
      ],
      "label": "",
      "contextText": "How long were you sober?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 54,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_55",
        "quicknotes.controls.54"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 55,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.check_if_no_history_of_tobacco_use",
        "quicknotes.controls.55"
      ],
      "label": "Check if NO history of Tobacco use",
      "contextText": "Check if NO history of Tobacco use",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10052",
        "id": "#cb-10052",
        "name": ""
      }
    },
    {
      "fillIndex": 56,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.56"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10053",
        "id": "#cb-10053",
        "name": ""
      }
    },
    {
      "fillIndex": 57,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.57"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10054",
        "id": "#cb-10054",
        "name": ""
      }
    },
    {
      "fillIndex": 58,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.58"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10055",
        "id": "#cb-10055",
        "name": ""
      }
    },
    {
      "fillIndex": 59,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.59"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10056",
        "id": "#cb-10056",
        "name": ""
      }
    },
    {
      "fillIndex": 60,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_much_do_you_use_and_how_often",
        "quicknotes.controls.60"
      ],
      "label": "",
      "contextText": "How much do you use and how often?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 61,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.61"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10058",
        "id": "#cb-10058",
        "name": ""
      }
    },
    {
      "fillIndex": 62,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.62"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10059",
        "id": "#cb-10059",
        "name": ""
      }
    },
    {
      "fillIndex": 63,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.63"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10060",
        "id": "#cb-10060",
        "name": ""
      }
    },
    {
      "fillIndex": 64,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.64"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10061",
        "id": "#cb-10061",
        "name": ""
      }
    },
    {
      "fillIndex": 65,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_tried_to_quit_in_the_past",
        "quicknotes.controls.65"
      ],
      "label": "",
      "contextText": "Have you tried to quit in the past?)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 66,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.check_if_no_history_of_withdrawl",
        "quicknotes.controls.66"
      ],
      "label": "Check if NO history of Withdrawl",
      "contextText": "Check if NO history of Withdrawl",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10063",
        "id": "#cb-10063",
        "name": ""
      }
    },
    {
      "fillIndex": 67,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.67"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10064",
        "id": "#cb-10064",
        "name": ""
      }
    },
    {
      "fillIndex": 68,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.68"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10065",
        "id": "#cb-10065",
        "name": ""
      }
    },
    {
      "fillIndex": 69,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_symptoms_did_you_experience",
        "quicknotes.controls.69"
      ],
      "label": "",
      "contextText": "What symptoms did you experience?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 70,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.70"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10067",
        "id": "#cb-10067",
        "name": ""
      }
    },
    {
      "fillIndex": 71,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.71"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10068",
        "id": "#cb-10068",
        "name": ""
      }
    },
    {
      "fillIndex": 72,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_long_did_your_symptoms_last",
        "quicknotes.controls.72"
      ],
      "label": "",
      "contextText": "How long did your symptoms last?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 73,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_long_after_your_last_use_did_these_symptoms_begin",
        "quicknotes.controls.73"
      ],
      "label": "",
      "contextText": "How long after your last use did these symptoms begin?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 74,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_did_you_manage_your_withdrawal_symptoms_detox_medication_etc",
        "quicknotes.controls.74"
      ],
      "label": "",
      "contextText": "How did you manage your withdrawal symptoms (detox, medication, etc.)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 75,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_times_have_you_detoxed",
        "quicknotes.controls.75"
      ],
      "label": "",
      "contextText": "How many times have you detoxed?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 76,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.total_number_of_inpatient_residential_treatments",
        "quicknotes.controls.76"
      ],
      "label": "",
      "contextText": "Total number of inpatient/residential treatments",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 77,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.total_number_of_outpatient_treatment_episodes",
        "quicknotes.controls.77"
      ],
      "label": "",
      "contextText": "Total number of outpatient treatment episodes",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 78,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.78"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10075",
        "id": "#cb-10075",
        "name": ""
      }
    },
    {
      "fillIndex": 79,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.79"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10076",
        "id": "#cb-10076",
        "name": ""
      }
    },
    {
      "fillIndex": 80,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.80"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10077",
        "id": "#cb-10077",
        "name": ""
      }
    },
    {
      "fillIndex": 81,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.81"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10078",
        "id": "#cb-10078",
        "name": ""
      }
    },
    {
      "fillIndex": 82,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_that_experience_like_for_you",
        "quicknotes.controls.82"
      ],
      "label": "",
      "contextText": "What was that experience like for you?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 83,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.check_if_no_history_of_mental_health",
        "quicknotes.controls.83"
      ],
      "label": "Check if NO history of Mental Health",
      "contextText": "Check if NO history of Mental Health",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10080",
        "id": "#cb-10080",
        "name": ""
      }
    },
    {
      "fillIndex": 84,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_ever_been_given_a_mental_health_diagnosis_is_yes_state_",
        "quicknotes.controls.84"
      ],
      "label": "",
      "contextText": "Have you ever been given a mental health diagnosis? Is yes, state diagnosis.",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 85,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_old_were_you_when_you_were_diagnosed",
        "quicknotes.controls.85"
      ],
      "label": "",
      "contextText": "How old were you when you were diagnosed?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 86,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.who_were_you_diagnosed_by_name_clinic_or_type_of_professional",
        "quicknotes.controls.86"
      ],
      "label": "",
      "contextText": "Who were you diagnosed by (name, clinic, or type of professional)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 87,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.87"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10084",
        "id": "#cb-10084",
        "name": ""
      }
    },
    {
      "fillIndex": 88,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.88"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10085",
        "id": "#cb-10085",
        "name": ""
      }
    },
    {
      "fillIndex": 89,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.were_you_using_any_substances_at_the_time_of_your_diagnosis",
        "quicknotes.controls.89"
      ],
      "label": "",
      "contextText": "Were you using any substances at the time of your diagnosis?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 90,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_yes_do_you_believe_your_use_impacted_your_diagnosis",
        "quicknotes.controls.90"
      ],
      "label": "",
      "contextText": "If yes, do you believe your use impacted your diagnosis?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 91,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.91"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10088",
        "id": "#cb-10088",
        "name": ""
      }
    },
    {
      "fillIndex": 92,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.92"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10089",
        "id": "#cb-10089",
        "name": ""
      }
    },
    {
      "fillIndex": 93,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.93"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10090",
        "id": "#cb-10090",
        "name": ""
      }
    },
    {
      "fillIndex": 94,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.94"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10091",
        "id": "#cb-10091",
        "name": ""
      }
    },
    {
      "fillIndex": 95,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.95"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10092",
        "id": "#cb-10092",
        "name": ""
      }
    },
    {
      "fillIndex": 96,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.96"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10093",
        "id": "#cb-10093",
        "name": ""
      }
    },
    {
      "fillIndex": 97,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_98",
        "quicknotes.controls.97"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 98,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.i_am_not_interested_in_receiving_any_resources_or_referrals",
        "quicknotes.controls.98"
      ],
      "label": "I am not interested in receiving any resources or referrals",
      "contextText": "I am not interested in receiving any resources or referrals",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10095",
        "id": "#cb-10095",
        "name": ""
      }
    },
    {
      "fillIndex": 99,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_100",
        "quicknotes.controls.99"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 100,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.100"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10097",
        "id": "#cb-10097",
        "name": ""
      }
    },
    {
      "fillIndex": 101,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.101"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10098",
        "id": "#cb-10098",
        "name": ""
      }
    },
    {
      "fillIndex": 102,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_ever_received_treatment_or_been_in_need_of_treatment_fo",
        "quicknotes.controls.102"
      ],
      "label": "",
      "contextText": "Have you ever received treatment or been in need of treatment for an eating disorder or disordered eating?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 103,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.103"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10100",
        "id": "#cb-10100",
        "name": ""
      }
    },
    {
      "fillIndex": 104,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.104"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10101",
        "id": "#cb-10101",
        "name": ""
      }
    },
    {
      "fillIndex": 105,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.105"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10102",
        "id": "#cb-10102",
        "name": ""
      }
    },
    {
      "fillIndex": 106,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.106"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10103",
        "id": "#cb-10103",
        "name": ""
      }
    },
    {
      "fillIndex": 107,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.107"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10104",
        "id": "#cb-10104",
        "name": ""
      }
    },
    {
      "fillIndex": 108,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.108"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10105",
        "id": "#cb-10105",
        "name": ""
      }
    },
    {
      "fillIndex": 109,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.109"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10106",
        "id": "#cb-10106",
        "name": ""
      }
    },
    {
      "fillIndex": 110,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.110"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10107",
        "id": "#cb-10107",
        "name": ""
      }
    },
    {
      "fillIndex": 111,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_was_going_on_in_your_life_when_these_thoughts_have_been_esp",
        "quicknotes.controls.111"
      ],
      "label": "",
      "contextText": "What was going on in your life when these thoughts have been especially difficult?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 112,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_did_these_thoughts_occur_dates_and_when_did_they_occur_most",
        "quicknotes.controls.112"
      ],
      "label": "",
      "contextText": "When did these thoughts occur (dates) and when did they occur most recently?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 113,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.can_you_describe_the_thoughts_you_experienced",
        "quicknotes.controls.113"
      ],
      "label": "",
      "contextText": "Can you describe the thoughts you experienced?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 114,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.114"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10111",
        "id": "#cb-10111",
        "name": ""
      }
    },
    {
      "fillIndex": 115,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.115"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10112",
        "id": "#cb-10112",
        "name": ""
      }
    },
    {
      "fillIndex": 116,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_attempts_have_you_had_in_your_lifetime",
        "quicknotes.controls.116"
      ],
      "label": "",
      "contextText": "How many attempts have you had in your lifetime?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 117,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_did_this_attempt_these_attempts_occur_years_dates_in_what_w",
        "quicknotes.controls.117"
      ],
      "label": "",
      "contextText": "When did this attempt/these attempts occur (years/dates)? In what way(s) did you attempt suicide in the past?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 118,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.were_you_under_the_influence_of_drugs_or_alcohol_at_the_time_of_",
        "quicknotes.controls.118"
      ],
      "label": "",
      "contextText": "Were you under the influence of drugs or alcohol at the time of the attempt(s)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 119,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_do_you_feel_about_your_past_attempt_s_now",
        "quicknotes.controls.119"
      ],
      "label": "",
      "contextText": "How do you feel about your past attempt(s) now?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 120,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_are_the_parts_of_your_life_that_keep_you_from_attempting_su",
        "quicknotes.controls.120"
      ],
      "label": "",
      "contextText": "What are the parts of your life that keep you from attempting suicide?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 121,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.is_there_anything_that_would_push_you_towards_a_suicide_attempt_",
        "quicknotes.controls.121"
      ],
      "label": "",
      "contextText": "Is there anything that would push you towards a suicide attempt in the future?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 122,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.122"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10119",
        "id": "#cb-10119",
        "name": ""
      }
    },
    {
      "fillIndex": 123,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.123"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10120",
        "id": "#cb-10120",
        "name": ""
      }
    },
    {
      "fillIndex": 124,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_did_you_engage_in_this_behavior_and_when_was_the_most_recen",
        "quicknotes.controls.124"
      ],
      "label": "",
      "contextText": "When did you engage in this behavior (and when was the most recent time)?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 125,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.in_what_ways_did_you_engage_in_self_harm",
        "quicknotes.controls.125"
      ],
      "label": "",
      "contextText": "In what ways did you engage in self-harm?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 126,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_do_you_feel_about_past_self_harming_now",
        "quicknotes.controls.126"
      ],
      "label": "",
      "contextText": "How do you feel about past self-harming now?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 127,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.do_you_have_access_to_means_to_engage_in_self_harm",
        "quicknotes.controls.127"
      ],
      "label": "",
      "contextText": "Do you have access to means to engage in self-harm?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 128,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.128"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10125",
        "id": "#cb-10125",
        "name": ""
      }
    },
    {
      "fillIndex": 129,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.129"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10126",
        "id": "#cb-10126",
        "name": ""
      }
    },
    {
      "fillIndex": 130,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.why_or_why_not",
        "quicknotes.controls.130"
      ],
      "label": "",
      "contextText": "Why or why not?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 131,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.131"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10128",
        "id": "#cb-10128",
        "name": ""
      }
    },
    {
      "fillIndex": 132,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.132"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10129",
        "id": "#cb-10129",
        "name": ""
      }
    },
    {
      "fillIndex": 133,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_do_those_experiences_impact_your_life_now",
        "quicknotes.controls.133"
      ],
      "label": "",
      "contextText": "How do those experiences impact your life now?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 134,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_interested_in_receiving_any_treatment_regarding_these_ex",
        "quicknotes.controls.134"
      ],
      "label": "",
      "contextText": "Are you interested in receiving any treatment regarding these experiences, if you have not already?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 135,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_currently_experiencing_any_grief_or_loss",
        "quicknotes.controls.135"
      ],
      "label": "",
      "contextText": "Are you currently experiencing any grief or loss?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 136,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_so_what_are_you_currently_grieving",
        "quicknotes.controls.136"
      ],
      "label": "",
      "contextText": "If so, what are you currently grieving?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 137,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.137"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10134",
        "id": "#cb-10134",
        "name": ""
      }
    },
    {
      "fillIndex": 138,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.138"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10135",
        "id": "#cb-10135",
        "name": ""
      }
    },
    {
      "fillIndex": 139,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.139"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10136",
        "id": "#cb-10136",
        "name": ""
      }
    },
    {
      "fillIndex": 140,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.140"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10137",
        "id": "#cb-10137",
        "name": ""
      }
    },
    {
      "fillIndex": 141,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.141"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10138",
        "id": "#cb-10138",
        "name": ""
      }
    },
    {
      "fillIndex": 142,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.142"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10139",
        "id": "#cb-10139",
        "name": ""
      }
    },
    {
      "fillIndex": 143,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.143"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10140",
        "id": "#cb-10140",
        "name": ""
      }
    },
    {
      "fillIndex": 144,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.144"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10141",
        "id": "#cb-10141",
        "name": ""
      }
    },
    {
      "fillIndex": 145,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.why_or_why_not",
        "quicknotes.controls.145"
      ],
      "label": "",
      "contextText": "Why or why not?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 146,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_times_throughout_your_life_have_you_been_arrested_if_at",
        "quicknotes.controls.146"
      ],
      "label": "",
      "contextText": "How many times throughout your life have you been arrested, if at all?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 147,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_ever_been_convicted_of_a_sex_crime",
        "quicknotes.controls.147"
      ],
      "label": "",
      "contextText": "Have you ever been convicted of a sex crime?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 148,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_were_the_results_of_the_arrest_s_e_g_jail_time_probation_cl",
        "quicknotes.controls.148"
      ],
      "label": "",
      "contextText": "What were the results of the arrest(s)? (E.g. jail time, probation, classes, etc.)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 149,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.149"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10146",
        "id": "#cb-10146",
        "name": ""
      }
    },
    {
      "fillIndex": 150,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.150"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10147",
        "id": "#cb-10147",
        "name": ""
      }
    },
    {
      "fillIndex": 151,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.151"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10148",
        "id": "#cb-10148",
        "name": ""
      }
    },
    {
      "fillIndex": 152,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.152"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10149",
        "id": "#cb-10149",
        "name": ""
      }
    },
    {
      "fillIndex": 153,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.153"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10150",
        "id": "#cb-10150",
        "name": ""
      }
    },
    {
      "fillIndex": 154,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.154"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10151",
        "id": "#cb-10151",
        "name": ""
      }
    },
    {
      "fillIndex": 155,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_deceased_when_did_she_pass_and_what_was_the_reason_for_her_pa",
        "quicknotes.controls.155"
      ],
      "label": "",
      "contextText": "If deceased: When did she pass and what was the reason for her passing?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 156,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_was_your_relationship_like_with_your_mother_are_you_in_c",
        "quicknotes.controls.156"
      ],
      "label": "",
      "contextText": "What is/was your relationship like with your mother? Are you in contact with her?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 157,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_mother_have_any_history_of_medical_conditions",
        "quicknotes.controls.157"
      ],
      "label": "",
      "contextText": "Does/did your mother have any history of medical conditions?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 158,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_mother_have_any_history_of_mental_health_difficult",
        "quicknotes.controls.158"
      ],
      "label": "",
      "contextText": "Does/did your mother have any history of mental health difficulties?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 159,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_mother_have_any_history_of_substance_abuse",
        "quicknotes.controls.159"
      ],
      "label": "",
      "contextText": "Does/did your mother have any history of substance abuse?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 160,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.160"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10157",
        "id": "#cb-10157",
        "name": ""
      }
    },
    {
      "fillIndex": 161,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.161"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10158",
        "id": "#cb-10158",
        "name": ""
      }
    },
    {
      "fillIndex": 162,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_deceased_when_did_he_pass_and_what_was_the_reason_for_his_pas",
        "quicknotes.controls.162"
      ],
      "label": "",
      "contextText": "If deceased: When did he pass and what was the reason for his passing?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 163,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_was_your_relationship_like_with_your_father_are_you_in_c",
        "quicknotes.controls.163"
      ],
      "label": "",
      "contextText": "What is/was your relationship like with your father? Are you in contact with him?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 164,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_father_have_any_history_of_medical_conditions",
        "quicknotes.controls.164"
      ],
      "label": "",
      "contextText": "Does/did your father have any history of medical conditions?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 165,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_father_have_any_history_of_mental_health_difficult",
        "quicknotes.controls.165"
      ],
      "label": "",
      "contextText": "Does/did your father have any history of mental health difficulties?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 166,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_did_your_father_have_any_history_of_substance_abuse",
        "quicknotes.controls.166"
      ],
      "label": "",
      "contextText": "Does/did your father have any history of substance abuse?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 167,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.167"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10164",
        "id": "#cb-10164",
        "name": ""
      }
    },
    {
      "fillIndex": 168,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.168"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10165",
        "id": "#cb-10165",
        "name": ""
      }
    },
    {
      "fillIndex": 169,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_170",
        "quicknotes.controls.169"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 170,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_affiliated_with_any_religion",
        "quicknotes.controls.170"
      ],
      "label": "",
      "contextText": "Are you affiliated with any religion?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 171,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_yes_would_you_consider_yourself_to_be_active_in_your_religion",
        "quicknotes.controls.171"
      ],
      "label": "",
      "contextText": "If yes, would you consider yourself to be active in your religion?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 172,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_173",
        "quicknotes.controls.172"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 173,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_174",
        "quicknotes.controls.173"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 174,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_currently_experiencing_any_physical_health_problems_note",
        "quicknotes.controls.174"
      ],
      "label": "",
      "contextText": "Are you currently experiencing any physical health problems? (Note if terminal illnesses are present)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 175,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.175"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10172",
        "id": "#cb-10172",
        "name": ""
      }
    },
    {
      "fillIndex": 176,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.176"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10173",
        "id": "#cb-10173",
        "name": ""
      }
    },
    {
      "fillIndex": 177,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.where_do_you_experience_pain",
        "quicknotes.controls.177"
      ],
      "label": "",
      "contextText": "Where do you experience pain?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 178,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_did_your_pain_begin",
        "quicknotes.controls.178"
      ],
      "label": "",
      "contextText": "When did your pain begin?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 179,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_helps_your_pain",
        "quicknotes.controls.179"
      ],
      "label": "",
      "contextText": "What helps your pain?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 180,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_does_your_pain_impact_your_functioning",
        "quicknotes.controls.180"
      ],
      "label": "",
      "contextText": "How does your pain impact your functioning?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 181,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_ever_used_opiates_for_pain",
        "quicknotes.controls.181"
      ],
      "label": "",
      "contextText": "Have you ever used opiates for pain?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 182,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_so_were_these_opiates_prescribed",
        "quicknotes.controls.182"
      ],
      "label": "",
      "contextText": "If so, were these opiates prescribed?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 183,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_you_ever_abuse_opiates",
        "quicknotes.controls.183"
      ],
      "label": "",
      "contextText": "Did you ever abuse opiates?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 184,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.do_you_have_a_primary_care_physician_or_a_primary_doctor",
        "quicknotes.controls.184"
      ],
      "label": "",
      "contextText": "Do you have a primary care physician or a primary doctor?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 185,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_so_what_clinic_do_you_go_through",
        "quicknotes.controls.185"
      ],
      "label": "",
      "contextText": "If so, what clinic do you go through?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 186,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_they_are_in_private_practice_what_is_your_doctors_name",
        "quicknotes.controls.186"
      ],
      "label": "",
      "contextText": "if they are in private practice, what is your doctor's name?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 187,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_was_the_last_time_you_saw_a_physician_and_had_a_full_physic",
        "quicknotes.controls.187"
      ],
      "label": "",
      "contextText": "When was the last time you saw a physician and had a full physical?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 188,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.188"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10185",
        "id": "#cb-10185",
        "name": ""
      }
    },
    {
      "fillIndex": 189,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.189"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10186",
        "id": "#cb-10186",
        "name": ""
      }
    },
    {
      "fillIndex": 190,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.190"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10187",
        "id": "#cb-10187",
        "name": ""
      }
    },
    {
      "fillIndex": 191,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.191"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10188",
        "id": "#cb-10188",
        "name": ""
      }
    },
    {
      "fillIndex": 192,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_occurs_when_you_have_an_allergic_reaction",
        "quicknotes.controls.192"
      ],
      "label": "",
      "contextText": "What occurs when you have an allergic reaction?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 193,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.do_you_have_or_need_an_epinephrine_pen",
        "quicknotes.controls.193"
      ],
      "label": "",
      "contextText": "Do you have or need an epinephrine pen?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 194,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.194"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10191",
        "id": "#cb-10191",
        "name": ""
      }
    },
    {
      "fillIndex": 195,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.195"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10192",
        "id": "#cb-10192",
        "name": ""
      }
    },
    {
      "fillIndex": 196,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_do_you_plan_to_see_a_dentist_next",
        "quicknotes.controls.196"
      ],
      "label": "",
      "contextText": "When do you plan to see a dentist next?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 197,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.medication_1_name",
        "quicknotes.controls.197"
      ],
      "label": "",
      "contextText": "Medication #1 Name:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 198,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_the_dosage_and_frequency_of_use",
        "quicknotes.controls.198"
      ],
      "label": "",
      "contextText": "What is the dosage and frequency of use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 199,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_experiencing_any_side_effects_if_so_indicate_what",
        "quicknotes.controls.199"
      ],
      "label": "",
      "contextText": "Are you experiencing any side effects? (If so, indicate what)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 200,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.200"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10197",
        "id": "#cb-10197",
        "name": ""
      }
    },
    {
      "fillIndex": 201,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.201"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10198",
        "id": "#cb-10198",
        "name": ""
      }
    },
    {
      "fillIndex": 202,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.202"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10199",
        "id": "#cb-10199",
        "name": ""
      }
    },
    {
      "fillIndex": 203,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.203"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10200",
        "id": "#cb-10200",
        "name": ""
      }
    },
    {
      "fillIndex": 204,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.medication_2_name",
        "quicknotes.controls.204"
      ],
      "label": "",
      "contextText": "Medication #2 Name:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 205,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_the_dosage_and_frequency_of_use",
        "quicknotes.controls.205"
      ],
      "label": "",
      "contextText": "What is the dosage and frequency of use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 206,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_experiencing_any_side_effects_if_so_indicate_what",
        "quicknotes.controls.206"
      ],
      "label": "",
      "contextText": "Are you experiencing any side effects? (If so, indicate what)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 207,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.207"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10204",
        "id": "#cb-10204",
        "name": ""
      }
    },
    {
      "fillIndex": 208,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.208"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10205",
        "id": "#cb-10205",
        "name": ""
      }
    },
    {
      "fillIndex": 209,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.209"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10206",
        "id": "#cb-10206",
        "name": ""
      }
    },
    {
      "fillIndex": 210,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.210"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10207",
        "id": "#cb-10207",
        "name": ""
      }
    },
    {
      "fillIndex": 211,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.medication_3_name",
        "quicknotes.controls.211"
      ],
      "label": "",
      "contextText": "Medication #3 Name:",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 212,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_the_dosage_and_frequency_of_use",
        "quicknotes.controls.212"
      ],
      "label": "",
      "contextText": "What is the dosage and frequency of use?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 213,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_experiencing_any_side_effects_if_so_indicate_what",
        "quicknotes.controls.213"
      ],
      "label": "",
      "contextText": "Are you experiencing any side effects? (If so, indicate what)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 214,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.214"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10211",
        "id": "#cb-10211",
        "name": ""
      }
    },
    {
      "fillIndex": 215,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.215"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10212",
        "id": "#cb-10212",
        "name": ""
      }
    },
    {
      "fillIndex": 216,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.216"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10213",
        "id": "#cb-10213",
        "name": ""
      }
    },
    {
      "fillIndex": 217,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.217"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10214",
        "id": "#cb-10214",
        "name": ""
      }
    },
    {
      "fillIndex": 218,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.218"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10215",
        "id": "#cb-10215",
        "name": ""
      }
    },
    {
      "fillIndex": 219,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.219"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10216",
        "id": "#cb-10216",
        "name": ""
      }
    },
    {
      "fillIndex": 220,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.sometimes",
        "quicknotes.controls.220"
      ],
      "label": "Sometimes",
      "contextText": "Sometimes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10217",
        "id": "#cb-10217",
        "name": ""
      }
    },
    {
      "fillIndex": 221,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_partners_have_you_had_in_the_last_year",
        "quicknotes.controls.221"
      ],
      "label": "",
      "contextText": "How many partners have you had in the last year?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 222,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.222"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10219",
        "id": "#cb-10219",
        "name": ""
      }
    },
    {
      "fillIndex": 223,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.223"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10220",
        "id": "#cb-10220",
        "name": ""
      }
    },
    {
      "fillIndex": 224,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes_paid",
        "quicknotes.controls.224"
      ],
      "label": "Yes (Paid)",
      "contextText": "Yes (Paid)",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10221",
        "id": "#cb-10221",
        "name": ""
      }
    },
    {
      "fillIndex": 225,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes_been_paid",
        "quicknotes.controls.225"
      ],
      "label": "Yes (Been Paid)",
      "contextText": "Yes (Been Paid)",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10222",
        "id": "#cb-10222",
        "name": ""
      }
    },
    {
      "fillIndex": 226,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.never",
        "quicknotes.controls.226"
      ],
      "label": "Never",
      "contextText": "Never",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10223",
        "id": "#cb-10223",
        "name": ""
      }
    },
    {
      "fillIndex": 227,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.has_your_use_of_drugs_or_alcohol_impacted_your_sex_life_if_so_ho",
        "quicknotes.controls.227"
      ],
      "label": "",
      "contextText": "Has your use of drugs or alcohol impacted your sex life? If so, how?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 228,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.228"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10225",
        "id": "#cb-10225",
        "name": ""
      }
    },
    {
      "fillIndex": 229,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.229"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10226",
        "id": "#cb-10226",
        "name": ""
      }
    },
    {
      "fillIndex": 230,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.230"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10227",
        "id": "#cb-10227",
        "name": ""
      }
    },
    {
      "fillIndex": 231,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.231"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10228",
        "id": "#cb-10228",
        "name": ""
      }
    },
    {
      "fillIndex": 232,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.additional_notes_as_needed",
        "quicknotes.controls.232"
      ],
      "label": "",
      "contextText": "Additional notes (as needed):",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 233,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.233"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10230",
        "id": "#cb-10230",
        "name": ""
      }
    },
    {
      "fillIndex": 234,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.234"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10231",
        "id": "#cb-10231",
        "name": ""
      }
    },
    {
      "fillIndex": 235,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.when_did_you_start_working_there",
        "quicknotes.controls.235"
      ],
      "label": "",
      "contextText": "When did you start working there?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 236,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_your_hourly_wage_or_annual_income",
        "quicknotes.controls.236"
      ],
      "label": "",
      "contextText": "What is your hourly wage or annual income?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 237,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_you_full_time_or_part_time",
        "quicknotes.controls.237"
      ],
      "label": "",
      "contextText": "Are you full time or part time?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 238,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_many_persons_are_living_on_your_income",
        "quicknotes.controls.238"
      ],
      "label": "",
      "contextText": "How many persons are living on your income?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 239,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_would_you_describe_the_current_state_of_your_finances",
        "quicknotes.controls.239"
      ],
      "label": "",
      "contextText": "How would you describe the current state of your finances?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 240,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.have_you_ever_been_in_trouble_at_work_due_to_your_substance_use_",
        "quicknotes.controls.240"
      ],
      "label": "",
      "contextText": "Have you ever been in trouble at work due to your substance use? If so, what happened?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 241,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_you_like_school_when_you_were_younger",
        "quicknotes.controls.241"
      ],
      "label": "",
      "contextText": "Did you like school when you were younger?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 242,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.do_you_have_any_diagnosed_learning_disabilities",
        "quicknotes.controls.242"
      ],
      "label": "",
      "contextText": "Do you have any diagnosed learning disabilities?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 243,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.were_you_involved_in_any_clubs_or_sports_when_you_were_younger",
        "quicknotes.controls.243"
      ],
      "label": "",
      "contextText": "Were you involved in any clubs or sports when you were younger?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 244,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_your_use_of_drugs_or_alcohol_ever_interfere_with_school",
        "quicknotes.controls.244"
      ],
      "label": "",
      "contextText": "Did your use of drugs or alcohol ever interfere with school?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 245,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.were_you_on_active_duty",
        "quicknotes.controls.245"
      ],
      "label": "",
      "contextText": "Were you on active duty?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 246,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.were_you_deployed",
        "quicknotes.controls.246"
      ],
      "label": "",
      "contextText": "Were you deployed?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 247,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_the_highest_rank_you_achieved",
        "quicknotes.controls.247"
      ],
      "label": "",
      "contextText": "What is the highest rank you achieved?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 248,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.what_is_your_discharge_status",
        "quicknotes.controls.248"
      ],
      "label": "",
      "contextText": "What is your discharge status?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 249,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.did_your_use_of_substances_interfere_with_your_time_in_the_milit",
        "quicknotes.controls.249"
      ],
      "label": "",
      "contextText": "Did your use of substances interfere with your time in the military?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 250,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.if_in_a_relationship_or_married_how_long_have_you_been_married_i",
        "quicknotes.controls.250"
      ],
      "label": "",
      "contextText": "If in a relationship or married: How long have you been married/in a relationship?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 251,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.how_would_you_describe_the_relationship",
        "quicknotes.controls.251"
      ],
      "label": "",
      "contextText": "How would you describe the relationship?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 252,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.has_your_use_of_substances_impacted_your_relationship_with_your_",
        "quicknotes.controls.252"
      ],
      "label": "",
      "contextText": "Has your use of substances impacted your relationship with your partner?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 253,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.does_your_partner_use_substances",
        "quicknotes.controls.253"
      ],
      "label": "",
      "contextText": "Does your partner use substances?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 254,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.are_there_any_substances_in_your_partners_living_space",
        "quicknotes.controls.254"
      ],
      "label": "",
      "contextText": "Are there any substances in your partner's living space?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 255,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.where_are_they_currently_living",
        "quicknotes.controls.255"
      ],
      "label": "",
      "contextText": "Where are they currently living?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 256,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.is_there_current_involvement_with_child_protective_services_if_s",
        "quicknotes.controls.256"
      ],
      "label": "",
      "contextText": "Is there current involvement with child protective services? (If so take note of case worker's name and phone number)",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 257,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.any_other_relevant_information_about_cps_case",
        "quicknotes.controls.257"
      ],
      "label": "",
      "contextText": "Any other relevant information about CPS case):",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 258,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.who_are_the_people_who_support_you_in_your_recovery",
        "quicknotes.controls.258"
      ],
      "label": "",
      "contextText": "Who are the people who support you in your recovery?",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 259,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_260",
        "quicknotes.controls.259"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 260,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.yes",
        "quicknotes.controls.260"
      ],
      "label": "Yes",
      "contextText": "Yes",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10257",
        "id": "#cb-10257",
        "name": ""
      }
    },
    {
      "fillIndex": 261,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.no",
        "quicknotes.controls.261"
      ],
      "label": "No",
      "contextText": "No",
      "type": "checkbox",
      "selectorHints": {
        "dataQnFieldId": "10258",
        "id": "#cb-10258",
        "name": ""
      }
    },
    {
      "fillIndex": 262,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_263",
        "quicknotes.controls.262"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 263,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_264",
        "quicknotes.controls.263"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 264,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_265",
        "quicknotes.controls.264"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 265,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_266",
        "quicknotes.controls.265"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 266,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.textarea_267",
        "quicknotes.controls.266"
      ],
      "label": "",
      "contextText": "textarea",
      "type": "textarea",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "",
        "name": ""
      }
    },
    {
      "fillIndex": 267,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.all",
        "quicknotes.controls.267"
      ],
      "label": "All",
      "contextText": "All Evaluation Session Note Treatment Plan",
      "type": "radio",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#pnpRadioCatAll",
        "name": "[name=\"categoryIDs\"]"
      }
    },
    {
      "fillIndex": 268,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.evaluation",
        "quicknotes.controls.268"
      ],
      "label": "Evaluation",
      "contextText": "All Evaluation Session Note Treatment Plan",
      "type": "radio",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#pnpRadioCat0",
        "name": "[name=\"categoryIDs\"]"
      }
    },
    {
      "fillIndex": 269,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.session_note",
        "quicknotes.controls.269"
      ],
      "label": "Session Note",
      "contextText": "All Evaluation Session Note Treatment Plan",
      "type": "radio",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#pnpRadioCat1",
        "name": "[name=\"categoryIDs\"]"
      }
    },
    {
      "fillIndex": 270,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.treatment_plan",
        "quicknotes.controls.270"
      ],
      "label": "Treatment Plan",
      "contextText": "All Evaluation Session Note Treatment Plan",
      "type": "radio",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#pnpRadioCat2",
        "name": "[name=\"categoryIDs\"]"
      }
    },
    {
      "fillIndex": 271,
      "paths": [
        "quicknotes_session_notes_for_provider_for_the_week_of_5_24.general_note",
        "quicknotes.controls.271"
      ],
      "label": "General Note",
      "contextText": "General Note",
      "type": "radio",
      "selectorHints": {
        "dataQnFieldId": "",
        "id": "#pnpRadioOtherGeneralNote",
        "name": "[name=\"radioOther\"]"
      }
    }
  ],
  "defaultAnswers": [],
  "releaseNotes": [
    "v0.1.0 adds Rose's 2026-05-25 QuickNotes / Group Notes 272-control discovery map from redacted source message."
  ]
};
