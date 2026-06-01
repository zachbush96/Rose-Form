window.DEFAULT_ROSE_WORKFLOW_CONFIG = {
  "project": "Rose ReliaTrax Workflow Modes",
  "version": "0.1.6",
  "updated": "2026-06-01",
  "modes": {
    "bps": {
      "title": "BPS Part 1",
      "description": "Current production workflow for BPS Part 1.",
      "configUrl": "https://raw.githubusercontent.com/zachbush96/Rose-Form/refs/heads/main/github-data/rose-reliatrax-bps-config.json"
    },
    "mse": {
      "title": "MSE Part 2",
      "description": "MSE Part 2 is mapped from fixtures/mse-part-2/MSE_Full_Form.JSON. Prompt returns structured JSON for every visible MSE row, and Fill active page writes mapped controls from Appearance through Judgment.",
      "mappingStatus": "mapped",
      "fieldMap": [
        {
          "paths": [
            "mse.items.appearance.selections.Casual Dress"
          ],
          "fillIndex": 3
        },
        {
          "paths": [
            "mse.items.appearance.selections.Normal Grooming"
          ],
          "fillIndex": 4
        },
        {
          "paths": [
            "mse.items.appearance.selections.Hygiene"
          ],
          "fillIndex": 5
        },
        {
          "paths": [
            "mse.items.appearance.selections.Appears Stated Age"
          ],
          "fillIndex": 6
        },
        {
          "paths": [
            "mse.items.appearance.selections.Poor Hygiene"
          ],
          "fillIndex": 7
        },
        {
          "paths": [
            "mse.items.appearance.selections.Appropriate for Weather"
          ],
          "fillIndex": 8
        },
        {
          "paths": [
            "mse.items.appearance.selections.Appears Older Than Stated Age"
          ],
          "fillIndex": 9
        },
        {
          "paths": [
            "mse.items.appearance.selections.Appears Younger Than Stated Age"
          ],
          "fillIndex": 10
        },
        {
          "paths": [
            "mse.items.appearance.selections.Unbathed"
          ],
          "fillIndex": 11
        },
        {
          "paths": [
            "mse.items.appearance.selections.Other"
          ],
          "fillIndex": 12
        },
        {
          "paths": [
            "mse.items.appearance.other_text",
            "mse.items.appearance.narrative"
          ],
          "fillIndex": 13
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Within Normal Limits"
          ],
          "fillIndex": 14
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Thin"
          ],
          "fillIndex": 15
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Overweight"
          ],
          "fillIndex": 16
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Short"
          ],
          "fillIndex": 17
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Tall"
          ],
          "fillIndex": 18
        },
        {
          "paths": [
            "mse.items.build_stature.selections.Other"
          ],
          "fillIndex": 19
        },
        {
          "paths": [
            "mse.items.build_stature.other_text",
            "mse.items.build_stature.narrative"
          ],
          "fillIndex": 20
        },
        {
          "paths": [
            "mse.items.posture.selections.Within Normal Limits"
          ],
          "fillIndex": 21
        },
        {
          "paths": [
            "mse.items.posture.selections.Slumped"
          ],
          "fillIndex": 22
        },
        {
          "paths": [
            "mse.items.posture.selections.Rigid"
          ],
          "fillIndex": 23
        },
        {
          "paths": [
            "mse.items.posture.selections.Tense"
          ],
          "fillIndex": 24
        },
        {
          "paths": [
            "mse.items.posture.selections.Atypical"
          ],
          "fillIndex": 25
        },
        {
          "paths": [
            "mse.items.posture.selections.Other"
          ],
          "fillIndex": 26
        },
        {
          "paths": [
            "mse.items.posture.other_text",
            "mse.items.posture.narrative"
          ],
          "fillIndex": 27
        },
        {
          "paths": [
            "mse.items.eye_contact.selections.Average"
          ],
          "fillIndex": 28
        },
        {
          "paths": [
            "mse.items.eye_contact.selections.Avoidant"
          ],
          "fillIndex": 29
        },
        {
          "paths": [
            "mse.items.eye_contact.selections.Intense"
          ],
          "fillIndex": 30
        },
        {
          "paths": [
            "mse.items.eye_contact.selections.Intermittent"
          ],
          "fillIndex": 31
        },
        {
          "paths": [
            "mse.items.eye_contact.selections.Other"
          ],
          "fillIndex": 32
        },
        {
          "paths": [
            "mse.items.eye_contact.other_text",
            "mse.items.eye_contact.narrative"
          ],
          "fillIndex": 33
        },
        {
          "paths": [
            "mse.items.activity.selections.Within Normal Limits"
          ],
          "fillIndex": 34
        },
        {
          "paths": [
            "mse.items.activity.selections.Accelerated"
          ],
          "fillIndex": 35
        },
        {
          "paths": [
            "mse.items.activity.selections.Slowed"
          ],
          "fillIndex": 36
        },
        {
          "paths": [
            "mse.items.activity.selections.Stereotyped/Peculiar"
          ],
          "fillIndex": 37
        },
        {
          "paths": [
            "mse.items.activity.selections.Impulsive"
          ],
          "fillIndex": 38
        },
        {
          "paths": [
            "mse.items.activity.selections.Agitated"
          ],
          "fillIndex": 39
        },
        {
          "paths": [
            "mse.items.activity.selections.Other"
          ],
          "fillIndex": 40
        },
        {
          "paths": [
            "mse.items.activity.other_text",
            "mse.items.activity.narrative"
          ],
          "fillIndex": 41
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Cooperative"
          ],
          "fillIndex": 42
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Hostile"
          ],
          "fillIndex": 43
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Defensive"
          ],
          "fillIndex": 44
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Evasive"
          ],
          "fillIndex": 45
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Anxious"
          ],
          "fillIndex": 46
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Seductive"
          ],
          "fillIndex": 47
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Mistrustful"
          ],
          "fillIndex": 48
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Demanding"
          ],
          "fillIndex": 49
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Manipulative"
          ],
          "fillIndex": 50
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Ingrating"
          ],
          "fillIndex": 51
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Confused"
          ],
          "fillIndex": 52
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.selections.Other"
          ],
          "fillIndex": 53
        },
        {
          "paths": [
            "mse.items.attitude_toward_examiner.other_text",
            "mse.items.attitude_toward_examiner.narrative"
          ],
          "fillIndex": 54
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Not Applicable"
          ],
          "fillIndex": 55
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Positive Interaction"
          ],
          "fillIndex": 56
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Ignores Parents"
          ],
          "fillIndex": 57
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Disrespectful"
          ],
          "fillIndex": 58
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Demanding"
          ],
          "fillIndex": 59
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Immature"
          ],
          "fillIndex": 60
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Lack of spontaneity"
          ],
          "fillIndex": 61
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.selections.Other"
          ],
          "fillIndex": 62
        },
        {
          "paths": [
            "mse.items.attitude_toward_parent_guardian.other_text",
            "mse.items.attitude_toward_parent_guardian.narrative"
          ],
          "fillIndex": 63
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Not Applicable"
          ],
          "fillIndex": 64
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Unremarkable/ age appropriate"
          ],
          "fillIndex": 65
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Clingy to parent/ but separates"
          ],
          "fillIndex": 66
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Disinhibited/ Does note Care"
          ],
          "fillIndex": 67
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Cannot separate"
          ],
          "fillIndex": 68
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.selections.Other"
          ],
          "fillIndex": 69
        },
        {
          "paths": [
            "mse.items.separation_children_adolescent.other_text",
            "mse.items.separation_children_adolescent.narrative"
          ],
          "fillIndex": 70
        },
        {
          "paths": [
            "mse.items.mood.selections.Euthymic"
          ],
          "fillIndex": 71
        },
        {
          "paths": [
            "mse.items.mood.selections.Depressed"
          ],
          "fillIndex": 72
        },
        {
          "paths": [
            "mse.items.mood.selections.Anxious"
          ],
          "fillIndex": 73
        },
        {
          "paths": [
            "mse.items.mood.selections.Angry"
          ],
          "fillIndex": 74
        },
        {
          "paths": [
            "mse.items.mood.selections.Euphoric"
          ],
          "fillIndex": 75
        },
        {
          "paths": [
            "mse.items.mood.selections.Irritable"
          ],
          "fillIndex": 76
        },
        {
          "paths": [
            "mse.items.mood.selections.Silly"
          ],
          "fillIndex": 77
        },
        {
          "paths": [
            "mse.items.mood.selections.Apathetic"
          ],
          "fillIndex": 78
        },
        {
          "paths": [
            "mse.items.mood.selections.Other"
          ],
          "fillIndex": 79
        },
        {
          "paths": [
            "mse.items.mood.other_text",
            "mse.items.mood.narrative"
          ],
          "fillIndex": 80
        },
        {
          "paths": [
            "mse.items.affect.selections.Full"
          ],
          "fillIndex": 81
        },
        {
          "paths": [
            "mse.items.affect.selections.Constricted"
          ],
          "fillIndex": 82
        },
        {
          "paths": [
            "mse.items.affect.selections.Flat"
          ],
          "fillIndex": 83
        },
        {
          "paths": [
            "mse.items.affect.selections.Inappropriate"
          ],
          "fillIndex": 84
        },
        {
          "paths": [
            "mse.items.affect.selections.Labile"
          ],
          "fillIndex": 85
        },
        {
          "paths": [
            "mse.items.affect.selections.Other"
          ],
          "fillIndex": 86
        },
        {
          "paths": [
            "mse.items.affect.other_text",
            "mse.items.affect.narrative"
          ],
          "fillIndex": 87
        },
        {
          "paths": [
            "mse.items.speech.selections.Clear"
          ],
          "fillIndex": 88
        },
        {
          "paths": [
            "mse.items.speech.selections.Slurred"
          ],
          "fillIndex": 89
        },
        {
          "paths": [
            "mse.items.speech.selections.Rapid"
          ],
          "fillIndex": 90
        },
        {
          "paths": [
            "mse.items.speech.selections.Pressured"
          ],
          "fillIndex": 91
        },
        {
          "paths": [
            "mse.items.speech.selections.Over productive"
          ],
          "fillIndex": 92
        },
        {
          "paths": [
            "mse.items.speech.selections.Under productive"
          ],
          "fillIndex": 93
        },
        {
          "paths": [
            "mse.items.speech.selections.Echoic"
          ],
          "fillIndex": 94
        },
        {
          "paths": [
            "mse.items.speech.selections.Other"
          ],
          "fillIndex": 95
        },
        {
          "paths": [
            "mse.items.speech.other_text",
            "mse.items.speech.narrative"
          ],
          "fillIndex": 96
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Logical"
          ],
          "fillIndex": 97
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Circumstantial"
          ],
          "fillIndex": 98
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Tangential"
          ],
          "fillIndex": 99
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Loose"
          ],
          "fillIndex": 100
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Racing"
          ],
          "fillIndex": 101
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Incoherent"
          ],
          "fillIndex": 102
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Concrete"
          ],
          "fillIndex": 103
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Blocked"
          ],
          "fillIndex": 104
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Flight of Ideas"
          ],
          "fillIndex": 105
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Poverty of content"
          ],
          "fillIndex": 106
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Slowed Thinking"
          ],
          "fillIndex": 107
        },
        {
          "paths": [
            "mse.items.thought_process.selections.Other"
          ],
          "fillIndex": 108
        },
        {
          "paths": [
            "mse.items.thought_process.other_text",
            "mse.items.thought_process.narrative"
          ],
          "fillIndex": 109
        },
        {
          "paths": [
            "mse.items.perception.selections.Within normal limits"
          ],
          "fillIndex": 110
        },
        {
          "paths": [
            "mse.items.perception.selections.Illusions"
          ],
          "fillIndex": 111
        },
        {
          "paths": [
            "mse.items.perception.selections.Depersonalizations"
          ],
          "fillIndex": 112
        },
        {
          "paths": [
            "mse.items.perception.selections.Derealization"
          ],
          "fillIndex": 113
        },
        {
          "paths": [
            "mse.items.perception.selections.Reexperiencing"
          ],
          "fillIndex": 114
        },
        {
          "paths": [
            "mse.items.perception.selections.Other"
          ],
          "fillIndex": 115
        },
        {
          "paths": [
            "mse.items.perception.other_text",
            "mse.items.perception.narrative"
          ],
          "fillIndex": 116
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Denied"
          ],
          "fillIndex": 117
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.None evidenced"
          ],
          "fillIndex": 118
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Auditory"
          ],
          "fillIndex": 119
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Command"
          ],
          "fillIndex": 120
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Visual"
          ],
          "fillIndex": 121
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Olfactory"
          ],
          "fillIndex": 122
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Tactile"
          ],
          "fillIndex": 123
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Gustatory"
          ],
          "fillIndex": 124
        },
        {
          "paths": [
            "mse.items.hallucinations.selections.Other"
          ],
          "fillIndex": 125
        },
        {
          "paths": [
            "mse.items.hallucinations.other_text",
            "mse.items.hallucinations.narrative"
          ],
          "fillIndex": 126
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Within normal limits"
          ],
          "fillIndex": 127
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Preoccupations/ruminations"
          ],
          "fillIndex": 128
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Obsessional"
          ],
          "fillIndex": 129
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Depressive"
          ],
          "fillIndex": 130
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Paranoid"
          ],
          "fillIndex": 131
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Self-depratory"
          ],
          "fillIndex": 132
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Grandiose"
          ],
          "fillIndex": 133
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Phobic"
          ],
          "fillIndex": 134
        },
        {
          "paths": [
            "mse.items.thought_content.selections.Other"
          ],
          "fillIndex": 135
        },
        {
          "paths": [
            "mse.items.thought_content.other_text",
            "mse.items.thought_content.narrative"
          ],
          "fillIndex": 136
        },
        {
          "paths": [
            "mse.items.delusions.selections.None reported"
          ],
          "fillIndex": 137
        },
        {
          "paths": [
            "mse.items.delusions.selections.Control"
          ],
          "fillIndex": 138
        },
        {
          "paths": [
            "mse.items.delusions.selections.Thought withdrawal"
          ],
          "fillIndex": 139
        },
        {
          "paths": [
            "mse.items.delusions.selections.Thought insertion"
          ],
          "fillIndex": 140
        },
        {
          "paths": [
            "mse.items.delusions.selections.Thought broadcasting"
          ],
          "fillIndex": 141
        },
        {
          "paths": [
            "mse.items.delusions.selections.Persecution"
          ],
          "fillIndex": 142
        },
        {
          "paths": [
            "mse.items.delusions.selections.Reference"
          ],
          "fillIndex": 143
        },
        {
          "paths": [
            "mse.items.delusions.selections.Grandeur"
          ],
          "fillIndex": 144
        },
        {
          "paths": [
            "mse.items.delusions.selections.Somatic"
          ],
          "fillIndex": 145
        },
        {
          "paths": [
            "mse.items.delusions.selections.Erotic"
          ],
          "fillIndex": 146
        },
        {
          "paths": [
            "mse.items.delusions.selections.Religious"
          ],
          "fillIndex": 147
        },
        {
          "paths": [
            "mse.items.delusions.selections.Other"
          ],
          "fillIndex": 148
        },
        {
          "paths": [
            "mse.items.delusions.other_text",
            "mse.items.delusions.narrative"
          ],
          "fillIndex": 149
        },
        {
          "paths": [
            "mse.items.cognition.selections.Within normal limits"
          ],
          "fillIndex": 150
        },
        {
          "paths": [
            "mse.items.cognition.selections.Impairment of"
          ],
          "fillIndex": 151
        },
        {
          "paths": [
            "mse.items.cognition.selections.Attention/concentration"
          ],
          "fillIndex": 152
        },
        {
          "paths": [
            "mse.items.cognition.selections.Ability to abstract"
          ],
          "fillIndex": 153
        },
        {
          "paths": [
            "mse.items.cognition.selections.Fund of knowledge"
          ],
          "fillIndex": 154
        },
        {
          "paths": [
            "mse.items.cognition.selections.Visiospatial ability"
          ],
          "fillIndex": 155
        },
        {
          "paths": [
            "mse.items.cognition.selections.Reading & writing"
          ],
          "fillIndex": 156
        },
        {
          "paths": [
            "mse.items.cognition.selections.Calculation ability"
          ],
          "fillIndex": 157
        },
        {
          "paths": [
            "mse.items.cognition.selections.Orientation"
          ],
          "fillIndex": 158
        },
        {
          "paths": [
            "mse.items.cognition.selections.Person"
          ],
          "fillIndex": 159
        },
        {
          "paths": [
            "mse.items.cognition.selections.Place"
          ],
          "fillIndex": 160
        },
        {
          "paths": [
            "mse.items.cognition.selections.Time"
          ],
          "fillIndex": 161
        },
        {
          "paths": [
            "mse.items.cognition.selections.Situation"
          ],
          "fillIndex": 162
        },
        {
          "paths": [
            "mse.items.cognition.selections.Memory"
          ],
          "fillIndex": 163
        },
        {
          "paths": [
            "mse.items.cognition.selections.Short term"
          ],
          "fillIndex": 164
        },
        {
          "paths": [
            "mse.items.cognition.selections.Long term"
          ],
          "fillIndex": 165
        },
        {
          "paths": [
            "mse.items.cognition.selections.Erratic/inconsistent"
          ],
          "fillIndex": 166
        },
        {
          "paths": [
            "mse.items.cognition.selections.Other"
          ],
          "fillIndex": 167
        },
        {
          "paths": [
            "mse.items.cognition.other_text",
            "mse.items.cognition.narrative"
          ],
          "fillIndex": 168
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.selections.Average"
          ],
          "fillIndex": 169
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.selections.Above average"
          ],
          "fillIndex": 170
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.selections.Borderline"
          ],
          "fillIndex": 171
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.selections.Mental retardation"
          ],
          "fillIndex": 172
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.selections.Other"
          ],
          "fillIndex": 173
        },
        {
          "paths": [
            "mse.items.intelligence_estimate.other_text",
            "mse.items.intelligence_estimate.narrative"
          ],
          "fillIndex": 174
        },
        {
          "paths": [
            "mse.items.insight.selections.Within normal limits"
          ],
          "fillIndex": 175
        },
        {
          "paths": [
            "mse.items.insight.selections.minimal insight"
          ],
          "fillIndex": 176
        },
        {
          "paths": [
            "mse.items.insight.selections.Partial insight"
          ],
          "fillIndex": 177
        },
        {
          "paths": [
            "mse.items.insight.selections.Mostly balames others"
          ],
          "fillIndex": 178
        },
        {
          "paths": [
            "mse.items.insight.selections.Difficulty acknowledging presence of Substance abuse problems"
          ],
          "fillIndex": 179
        },
        {
          "paths": [
            "mse.items.insight.selections.Difficulty acknowledging presence of psychiatric problems"
          ],
          "fillIndex": 180
        },
        {
          "paths": [
            "mse.items.insight.selections.Other"
          ],
          "fillIndex": 181
        },
        {
          "paths": [
            "mse.items.insight.other_text",
            "mse.items.insight.narrative"
          ],
          "fillIndex": 182
        },
        {
          "paths": [
            "mse.items.judgment.selections.Within normal limits"
          ],
          "fillIndex": 183
        },
        {
          "paths": [
            "mse.items.judgment.selections.Impaired ability to make reasonable decisions"
          ],
          "fillIndex": 184
        },
        {
          "paths": [
            "mse.items.judgment.selections.Mild"
          ],
          "fillIndex": 185
        },
        {
          "paths": [
            "mse.items.judgment.selections.Moderate"
          ],
          "fillIndex": 186
        },
        {
          "paths": [
            "mse.items.judgment.selections.Severe"
          ],
          "fillIndex": 187
        },
        {
          "paths": [
            "mse.items.judgment.selections.Other"
          ],
          "fillIndex": 188
        },
        {
          "paths": [
            "mse.items.judgment.other_text",
            "mse.items.judgment.narrative"
          ],
          "fillIndex": 189
        }
      ],
      "defaultAnswers": [
        {
          "question": "mse.items.appearance.selections.Casual Dress",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Normal Grooming",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Hygiene",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Appears Stated Age",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Poor Hygiene",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Appropriate for Weather",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Appears Older Than Stated Age",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Appears Younger Than Stated Age",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Unbathed",
          "answer": false
        },
        {
          "question": "mse.items.appearance.selections.Other",
          "answer": true
        },
        {
          "question": "mse.items.appearance.other_text",
          "answer": "Unknown - Interview conducted via phone call"
        },
        {
          "question": "mse.items.build_stature.selections.Within Normal Limits",
          "answer": false
        },
        {
          "question": "mse.items.build_stature.selections.Thin",
          "answer": false
        },
        {
          "question": "mse.items.build_stature.selections.Overweight",
          "answer": false
        },
        {
          "question": "mse.items.build_stature.selections.Short",
          "answer": false
        },
        {
          "question": "mse.items.build_stature.selections.Tall",
          "answer": false
        },
        {
          "question": "mse.items.build_stature.selections.Other",
          "answer": true
        },
        {
          "question": "mse.items.build_stature.other_text",
          "answer": "Unknown - Interview conducted via phone call"
        },
        {
          "question": "mse.items.posture.selections.Within Normal Limits",
          "answer": false
        },
        {
          "question": "mse.items.posture.selections.Slumped",
          "answer": false
        },
        {
          "question": "mse.items.posture.selections.Rigid",
          "answer": false
        },
        {
          "question": "mse.items.posture.selections.Tense",
          "answer": false
        },
        {
          "question": "mse.items.posture.selections.Atypical",
          "answer": false
        },
        {
          "question": "mse.items.posture.selections.Other",
          "answer": true
        },
        {
          "question": "mse.items.posture.other_text",
          "answer": "Unknown - Interview conducted via phone call"
        },
        {
          "question": "mse.items.eye_contact.selections.Average",
          "answer": false
        },
        {
          "question": "mse.items.eye_contact.selections.Avoidant",
          "answer": false
        },
        {
          "question": "mse.items.eye_contact.selections.Intense",
          "answer": false
        },
        {
          "question": "mse.items.eye_contact.selections.Intermittent",
          "answer": false
        },
        {
          "question": "mse.items.eye_contact.selections.Other",
          "answer": true
        },
        {
          "question": "mse.items.eye_contact.other_text",
          "answer": "Unknown - Interview conducted via phone call"
        },
        {
          "question": "mse.items.activity.selections.Within Normal Limits",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Accelerated",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Slowed",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Stereotyped/Peculiar",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Impulsive",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Agitated",
          "answer": false
        },
        {
          "question": "mse.items.activity.selections.Other",
          "answer": true
        },
        {
          "question": "mse.items.activity.other_text",
          "answer": "Unknown - Interview conducted via phone call"
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Cooperative",
          "answer": true
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Hostile",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Defensive",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Evasive",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Anxious",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Seductive",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Mistrustful",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Demanding",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Manipulative",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Ingrating",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Confused",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_examiner.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Not Applicable",
          "answer": true
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Positive Interaction",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Ignores Parents",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Disrespectful",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Demanding",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Immature",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Lack of spontaneity",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.attitude_toward_parent_guardian.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Not Applicable",
          "answer": true
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Unremarkable/ age appropriate",
          "answer": false
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Clingy to parent/ but separates",
          "answer": false
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Disinhibited/ Does note Care",
          "answer": false
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Cannot separate",
          "answer": false
        },
        {
          "question": "mse.items.separation_children_adolescent.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.separation_children_adolescent.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.mood.selections.Euthymic",
          "answer": true
        },
        {
          "question": "mse.items.mood.selections.Depressed",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Anxious",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Angry",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Euphoric",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Irritable",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Silly",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Apathetic",
          "answer": false
        },
        {
          "question": "mse.items.mood.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.mood.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.affect.selections.Full",
          "answer": true
        },
        {
          "question": "mse.items.affect.selections.Constricted",
          "answer": false
        },
        {
          "question": "mse.items.affect.selections.Flat",
          "answer": false
        },
        {
          "question": "mse.items.affect.selections.Inappropriate",
          "answer": false
        },
        {
          "question": "mse.items.affect.selections.Labile",
          "answer": false
        },
        {
          "question": "mse.items.affect.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.affect.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.speech.selections.Clear",
          "answer": true
        },
        {
          "question": "mse.items.speech.selections.Slurred",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Rapid",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Pressured",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Over productive",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Under productive",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Echoic",
          "answer": false
        },
        {
          "question": "mse.items.speech.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.speech.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.thought_process.selections.Logical",
          "answer": true
        },
        {
          "question": "mse.items.thought_process.selections.Circumstantial",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Tangential",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Loose",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Racing",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Incoherent",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Concrete",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Blocked",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Flight of Ideas",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Poverty of content",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Slowed Thinking",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.thought_process.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.perception.selections.Within normal limits",
          "answer": true
        },
        {
          "question": "mse.items.perception.selections.Illusions",
          "answer": false
        },
        {
          "question": "mse.items.perception.selections.Depersonalizations",
          "answer": false
        },
        {
          "question": "mse.items.perception.selections.Derealization",
          "answer": false
        },
        {
          "question": "mse.items.perception.selections.Reexperiencing",
          "answer": false
        },
        {
          "question": "mse.items.perception.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.perception.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.hallucinations.selections.Denied",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.None evidenced",
          "answer": true
        },
        {
          "question": "mse.items.hallucinations.selections.Auditory",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Command",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Visual",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Olfactory",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Tactile",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Gustatory",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.hallucinations.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.thought_content.selections.Within normal limits",
          "answer": true
        },
        {
          "question": "mse.items.thought_content.selections.Preoccupations/ruminations",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Obsessional",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Depressive",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Paranoid",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Self-depratory",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Grandiose",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Phobic",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.thought_content.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.delusions.selections.None reported",
          "answer": true
        },
        {
          "question": "mse.items.delusions.selections.Control",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Thought withdrawal",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Thought insertion",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Thought broadcasting",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Persecution",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Reference",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Grandeur",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Somatic",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Erotic",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Religious",
          "answer": false
        },
        {
          "question": "mse.items.delusions.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.delusions.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.cognition.selections.Within normal limits",
          "answer": true
        },
        {
          "question": "mse.items.cognition.selections.Impairment of",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Attention/concentration",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Ability to abstract",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Fund of knowledge",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Visiospatial ability",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Reading & writing",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Calculation ability",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Orientation",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Person",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Place",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Time",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Situation",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Memory",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Short term",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Long term",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Erratic/inconsistent",
          "answer": false
        },
        {
          "question": "mse.items.cognition.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.cognition.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.intelligence_estimate.selections.Average",
          "answer": true
        },
        {
          "question": "mse.items.intelligence_estimate.selections.Above average",
          "answer": false
        },
        {
          "question": "mse.items.intelligence_estimate.selections.Borderline",
          "answer": false
        },
        {
          "question": "mse.items.intelligence_estimate.selections.Mental retardation",
          "answer": false
        },
        {
          "question": "mse.items.intelligence_estimate.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.intelligence_estimate.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.insight.selections.Within normal limits",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.minimal insight",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.Partial insight",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.Mostly balames others",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.Difficulty acknowledging presence of Substance abuse problems",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.Difficulty acknowledging presence of psychiatric problems",
          "answer": false
        },
        {
          "question": "mse.items.insight.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.insight.other_text",
          "answer": ""
        },
        {
          "question": "mse.items.judgment.selections.Within normal limits",
          "answer": true
        },
        {
          "question": "mse.items.judgment.selections.Impaired ability to make reasonable decisions",
          "answer": false
        },
        {
          "question": "mse.items.judgment.selections.Mild",
          "answer": false
        },
        {
          "question": "mse.items.judgment.selections.Moderate",
          "answer": false
        },
        {
          "question": "mse.items.judgment.selections.Severe",
          "answer": false
        },
        {
          "question": "mse.items.judgment.selections.Other",
          "answer": false
        },
        {
          "question": "mse.items.judgment.other_text",
          "answer": ""
        }
      ],
      "sourcePrompt": {
        "title": "Part 2 MSE source prompt",
        "source": "Rose Gmail 19e62244b6e326bf, 2026-05-25 9:36 PM Central",
        "body": "You are creating a Biopsychosocial (BPS) Part 2 Mental Health Status Exam from the transcript provided.\n\nReturn one valid JSON object only. Do not include markdown, comments, prose outside JSON, or trailing commas.\n\nUse this exact top-level shape:\n{\n  \"mse\": {\n    \"interview_method\": \"phone\",\n    \"items\": {\n      \"appearance\": { \"selections\": [], \"other_text\": \"\" },\n      \"build_stature\": { \"selections\": [], \"other_text\": \"\" },\n      \"posture\": { \"selections\": [], \"other_text\": \"\" },\n      \"eye_contact\": { \"selections\": [], \"other_text\": \"\" },\n      \"activity\": { \"selections\": [], \"other_text\": \"\" },\n      \"attitude_toward_examiner\": { \"selections\": [], \"other_text\": \"\" },\n      \"attitude_toward_parent_guardian\": { \"selections\": [], \"other_text\": \"\" },\n      \"separation_children_adolescent\": { \"selections\": [], \"other_text\": \"\" },\n      \"mood\": { \"selections\": [], \"other_text\": \"\" },\n      \"affect\": { \"selections\": [], \"other_text\": \"\" },\n      \"speech\": { \"selections\": [], \"other_text\": \"\" },\n      \"thought_process\": { \"selections\": [], \"other_text\": \"\" },\n      \"perception\": { \"selections\": [], \"other_text\": \"\" },\n      \"hallucinations\": { \"selections\": [], \"other_text\": \"\" },\n      \"thought_content\": { \"selections\": [], \"other_text\": \"\" },\n      \"delusions\": { \"selections\": [], \"other_text\": \"\" },\n      \"cognition\": { \"selections\": [], \"other_text\": \"\" },\n      \"intelligence_estimate\": { \"selections\": [], \"other_text\": \"\" },\n      \"insight\": { \"selections\": [], \"other_text\": \"\" },\n      \"judgment\": { \"selections\": [], \"other_text\": \"\" }\n    }\n  }\n}\n\ninterview_method must be one of: phone, in_person, telehealth_video, unknown. Use only checkbox labels from the ReliaTrax MSE form in selections. If Other is selected, other_text must be a complete clinical sentence and must never be blank. If Other is not selected, other_text must be an empty string.\n\nAvailable form labels by item:\n- appearance: Casual Dress; Normal Grooming; Hygiene; Appears Stated Age; Poor Hygiene; Appropriate for Weather; Appears Older Than Stated Age; Appears Younger Than Stated Age; Unbathed; Other\n- build_stature: Within Normal Limits; Thin; Overweight; Short; Tall; Other\n- posture: Within Normal Limits; Slumped; Rigid; Tense; Atypical; Other\n- eye_contact: Average; Avoidant; Intense; Intermittent; Other\n- activity: Within Normal Limits; Accelerated; Slowed; Stereotyped/Peculiar; Impulsive; Agitated; Other\n- attitude_toward_examiner: Cooperative; Hostile; Defensive; Evasive; Anxious; Seductive; Mistrustful; Demanding; Manipulative; Ingrating; Confused; Other\n- attitude_toward_parent_guardian: Not Applicable; Positive Interaction; Ignores Parents; Disrespectful; Demanding; Immature; Lack of spontaneity; Other\n- separation_children_adolescent: Not Applicable; Unremarkable/ age appropriate; Clingy to parent/ but separates; Disinhibited/ Does note Care; Cannot separate; Other\n- mood: Euthymic; Depressed; Anxious; Angry; Euphoric; Irritable; Silly; Apathetic; Other\n- affect: Full; Constricted; Flat; Inappropriate; Labile; Other\n- speech: Clear; Slurred; Rapid; Pressured; Over productive; Under productive; Echoic; Other\n- thought_process: Logical; Circumstantial; Tangential; Loose; Racing; Incoherent; Concrete; Blocked; Flight of Ideas; Poverty of content; Slowed Thinking; Other\n- perception: Within normal limits; Illusions; Depersonalizations; Derealization; Reexperiencing; Other\n- hallucinations: Denied; None evidenced; Auditory; Command; Visual; Olfactory; Tactile; Gustatory; Other\n- thought_content: Within normal limits; Preoccupations/ruminations; Obsessional; Depressive; Paranoid; Self-depratory; Grandiose; Phobic; Other\n- delusions: None reported; Control; Thought withdrawal; Thought insertion; Thought broadcasting; Persecution; Reference; Grandeur; Somatic; Erotic; Religious; Other\n- cognition: Within normal limits; Impairment of; Attention/concentration; Ability to abstract; Fund of knowledge; Visiospatial ability; Reading & writing; Calculation ability; Orientation; Person; Place; Time; Situation; Memory; Short term; Long term; Erratic/inconsistent; Other\n- intelligence_estimate: Average; Above average; Borderline; Mental retardation; Other\n- insight: Within normal limits; minimal insight; Partial insight; Mostly balames others; Difficulty acknowledging presence of Substance abuse problems; Difficulty acknowledging presence of psychiatric problems; Other\n- judgment: Within normal limits; Impaired ability to make reasonable decisions; Mild; Moderate; Severe; Other\n\nAssessment is completed by phone unless the transcript explicitly says otherwise. For phone assessments, do not infer visual presentation. For appearance, build_stature, posture, eye_contact, and activity, select Other and write exactly: 'Unknown - Interview conducted via phone call' (No period after Unknown - Interview conducted via phone call). Do not estimate appearance, body type, posture, eye contact, or activity level from a phone call.\n\nDefaults and conservative logic:\n- attitude_toward_examiner defaults to Cooperative unless clearly contradicted.\n- attitude_toward_parent_guardian defaults to Not Applicable unless this is a child/adolescent assessment involving a parent or guardian.\n- separation_children_adolescent defaults to Not Applicable unless child/adolescent separation behavior is clinically relevant.\n- mood defaults to Euthymic, but add supported mood selections or Other narrative when clinically useful.\n- affect defaults to Full.\n- speech defaults to Clear.\n- thought_process defaults to Logical.\n- perception defaults to Within normal limits only when there is no reported or evidenced perceptual disturbance. Reported hallucinations are a perception abnormality even when the perception row has no Auditory checkbox. If hallucinations, command voices, illusions, depersonalization, derealization, or trauma reexperiencing are reported, do not select Within normal limits; select the best available perception checkbox and/or Other with a narrative.\n- hallucinations uses Denied only when hallucinations are directly denied, None evidenced only when no hallucinations are evidenced and none are reported, and subtype selections plus Other with narrative when hallucinations are present or substance-induced. When hallucinations are present, do not select Denied or None evidenced. Command voices such as voices saying \"do it now\" or \"wait till later\" must select Auditory, Command, and Other, with the command content summarized in other_text.\n- thought_content defaults to Within normal limits only when the transcript does not contain clinically relevant unusual, preoccupied, paranoid, depressive, obsessive, grandiose, religious, or phobic content. Religious themes, feeling like a messenger, unusual spiritual references, or repeated spiritual preoccupation belong in thought_content as Preoccupations/ruminations and Other when clinically relevant, even if the belief is not delusional.\n- delusions defaults to None reported unless the transcript supports a fixed false belief, delusional conviction, bizarre belief, clear loss of reality testing, or the client/clinician explicitly identifies delusions. Do not select Religious, Reference, Grandeur, or Other merely because the client discusses faith, spirituality, or feeling like a messenger. If religious or messenger content is present but delusional conviction is not supported, select only None reported and leave other_text blank.\n- cognition defaults to Within normal limits unless impairment is supported. If impaired, do not select Within normal limits; select Impairment of plus relevant subareas and Other narrative. Illiteracy, learning disability, impaired abstraction, or functional reading/writing limitations support Reading & writing and Other.\n- intelligence_estimate defaults to Average unless transcript supports otherwise. If illiteracy, learning disability, low-average functioning, or functional cognitive limitations are reported, do not select Average; select Other with a clinical estimate such as low-average range and explain the limitation.\n- insight has no fixed default; choose the best supported option and use Other narrative for fair, partial, limited, poor, or nuanced insight.\n- judgment often uses Within normal limits, but use Impaired ability to make reasonable decisions plus Mild, Moderate, or Severe and Other narrative when supported by repeated legal issues, ongoing substance use despite consequences, unsafe behavior, or poor follow-through. Do not select Within normal limits when judgment impairment is evidenced.\n\nMSE checkbox conflict rule: default-normal selections are mutually exclusive with abnormal selections and Other narratives. If any item includes Other, or includes any abnormal selection, do not include that item's normal/default option in selections. Specifically, do not combine Within normal limits, Within Normal Limits, None reported, None evidenced, or Denied with Other or with abnormal findings such as Auditory, Command, Preoccupations/ruminations, Impairment of, or impaired judgment. Example: perception with reported command auditory hallucinations must be [\"Other\"] with other_text describing the perceptual disturbance, and must not include Within normal limits. Example: hallucinations with reported command auditory hallucinations must be [\"Auditory\", \"Command\", \"Other\"] with other_text, and must not include Denied or None evidenced. Example: religious messenger content without fixed false belief belongs in thought_content, not delusions; delusions should remain [\"None reported\"] unless delusional conviction is supported. Example: perception, thought_content, cognition, insight, and judgment must not include Within normal limits when the item also has Other or any abnormal selection.\n\nBefore finalizing, cross-check these linked MSE rows: if hallucinations are present, perception cannot be Within normal limits; if thought_content contains religious or messenger themes, delusions must still be None reported unless fixed false belief is supported; if cognition notes illiteracy or learning disability, intelligence_estimate cannot simply default to Average; if legal/substance consequences are repeated, judgment cannot be Within normal limits.\n\nUse conservative clinical inference. Prefer normal/default selections when the transcript does not support an abnormal finding. Use the client first name, third person, professional clinical language, and no em dashes. For insight and judgment, if the presentation is anything other than good or within normal limits, select Other and write a brief other_text explanation such as Fair insight with some acknowledgment of problems, as evidenced by... or Fair judgment with some acknowledgment of problems, as supported by.... If the transcript does not support an abnormal finding, select the default/normal option and do not select Other or include other_text narrative for that item."
      },
      "expectedFieldCount": 194,
      "selector": "textarea, select, input:not([type=\"hidden\"]):not([type=\"submit\"]):not([type=\"button\"]):not([type=\"reset\"]):not([type=\"image\"]), [contenteditable=\"true\"]",
      "onlyVisibleControls": true
    },
    "asam": {
      "title": "Case Management and ASAM Part 3",
      "description": "Mapped Case Management Assessment workflow for Functioning scores, ASAM Criteria dimensions, and additional safety planning fields from Rose files received 2026-05-31.",
      "mappingStatus": "mapped",
      "fieldMap": [
        {
          "fillIndex": 455,
          "paths": [
            "case_management.items.housing.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Housing - None",
          "type": "checkbox",
          "dataQnFieldId": "10451"
        },
        {
          "fillIndex": 456,
          "paths": [
            "case_management.items.housing.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Housing - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10452"
        },
        {
          "fillIndex": 457,
          "paths": [
            "case_management.items.housing.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Housing - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10453"
        },
        {
          "fillIndex": 458,
          "paths": [
            "case_management.items.housing.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Housing - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10454"
        },
        {
          "fillIndex": 459,
          "paths": [
            "case_management.items.financial_stressors.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Financial Stressors - None",
          "type": "checkbox",
          "dataQnFieldId": "10455"
        },
        {
          "fillIndex": 460,
          "paths": [
            "case_management.items.financial_stressors.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Financial Stressors - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10456"
        },
        {
          "fillIndex": 461,
          "paths": [
            "case_management.items.financial_stressors.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Financial Stressors - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10457"
        },
        {
          "fillIndex": 462,
          "paths": [
            "case_management.items.financial_stressors.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Financial Stressors - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10458"
        },
        {
          "fillIndex": 463,
          "paths": [
            "case_management.items.legal.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Legal - None",
          "type": "checkbox",
          "dataQnFieldId": "10459"
        },
        {
          "fillIndex": 464,
          "paths": [
            "case_management.items.legal.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Legal - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10460"
        },
        {
          "fillIndex": 465,
          "paths": [
            "case_management.items.legal.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Legal - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10461"
        },
        {
          "fillIndex": 466,
          "paths": [
            "case_management.items.legal.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Legal - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10462"
        },
        {
          "fillIndex": 467,
          "paths": [
            "case_management.items.employment.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Employment - None",
          "type": "checkbox",
          "dataQnFieldId": "10463"
        },
        {
          "fillIndex": 468,
          "paths": [
            "case_management.items.employment.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Employment - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10464"
        },
        {
          "fillIndex": 469,
          "paths": [
            "case_management.items.employment.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Employment - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10465"
        },
        {
          "fillIndex": 470,
          "paths": [
            "case_management.items.employment.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Employment - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10466"
        },
        {
          "fillIndex": 471,
          "paths": [
            "case_management.items.education_vocation.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Education/Vocation - None",
          "type": "checkbox",
          "dataQnFieldId": "10467"
        },
        {
          "fillIndex": 472,
          "paths": [
            "case_management.items.education_vocation.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Education/Vocation - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10468"
        },
        {
          "fillIndex": 473,
          "paths": [
            "case_management.items.education_vocation.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Education/Vocation - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10469"
        },
        {
          "fillIndex": 474,
          "paths": [
            "case_management.items.education_vocation.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Education/Vocation - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10470"
        },
        {
          "fillIndex": 475,
          "paths": [
            "case_management.items.independent_living.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Independent Living - None",
          "type": "checkbox",
          "dataQnFieldId": "10471"
        },
        {
          "fillIndex": 476,
          "paths": [
            "case_management.items.independent_living.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Independent Living - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10472"
        },
        {
          "fillIndex": 477,
          "paths": [
            "case_management.items.independent_living.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Independent Living - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10473"
        },
        {
          "fillIndex": 478,
          "paths": [
            "case_management.items.independent_living.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Independent Living - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10474"
        },
        {
          "fillIndex": 479,
          "paths": [
            "case_management.items.medical.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Medical - None",
          "type": "checkbox",
          "dataQnFieldId": "10475"
        },
        {
          "fillIndex": 480,
          "paths": [
            "case_management.items.medical.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Medical - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10476"
        },
        {
          "fillIndex": 481,
          "paths": [
            "case_management.items.medical.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Medical - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10477"
        },
        {
          "fillIndex": 482,
          "paths": [
            "case_management.items.medical.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Medical - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10478"
        },
        {
          "fillIndex": 483,
          "paths": [
            "case_management.items.social_natural_supports.selections.None"
          ],
          "section": "Case Management Assessment",
          "label": "Social/Natural Supports - None",
          "type": "checkbox",
          "dataQnFieldId": "10479"
        },
        {
          "fillIndex": 484,
          "paths": [
            "case_management.items.social_natural_supports.selections.Mild"
          ],
          "section": "Case Management Assessment",
          "label": "Social/Natural Supports - Mild",
          "type": "checkbox",
          "dataQnFieldId": "10480"
        },
        {
          "fillIndex": 485,
          "paths": [
            "case_management.items.social_natural_supports.selections.Moderate"
          ],
          "section": "Case Management Assessment",
          "label": "Social/Natural Supports - Moderate",
          "type": "checkbox",
          "dataQnFieldId": "10481"
        },
        {
          "fillIndex": 486,
          "paths": [
            "case_management.items.social_natural_supports.selections.Severe"
          ],
          "section": "Case Management Assessment",
          "label": "Social/Natural Supports - Severe",
          "type": "checkbox",
          "dataQnFieldId": "10482"
        },
        {
          "fillIndex": 487,
          "paths": [
            "case_management.asam_criteria.dimension_1.text",
            "case_management.asam_criteria.dimension_1.narrative",
            "case_management.asam_criteria.dimension_1.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 1 - Acute Intoxication and/or Withdrawal Potential",
          "type": "textarea",
          "dataQnFieldId": "10483"
        },
        {
          "fillIndex": 488,
          "paths": [
            "case_management.asam_criteria.dimension_2.text",
            "case_management.asam_criteria.dimension_2.narrative",
            "case_management.asam_criteria.dimension_2.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 2 - Biomedical Conditions and Complications",
          "type": "textarea",
          "dataQnFieldId": "10484"
        },
        {
          "fillIndex": 489,
          "paths": [
            "case_management.asam_criteria.dimension_3.text",
            "case_management.asam_criteria.dimension_3.narrative",
            "case_management.asam_criteria.dimension_3.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 3 - Emotional, Behavioral, or Cognitive Conditions and Complications",
          "type": "textarea",
          "dataQnFieldId": "10485"
        },
        {
          "fillIndex": 490,
          "paths": [
            "case_management.asam_criteria.dimension_4.text",
            "case_management.asam_criteria.dimension_4.narrative",
            "case_management.asam_criteria.dimension_4.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 4 - Readiness to Change",
          "type": "textarea",
          "dataQnFieldId": "10486"
        },
        {
          "fillIndex": 491,
          "paths": [
            "case_management.asam_criteria.dimension_5.text",
            "case_management.asam_criteria.dimension_5.narrative",
            "case_management.asam_criteria.dimension_5.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 5 - Relapse, Continued Use, or Continued Problem Potential",
          "type": "textarea",
          "dataQnFieldId": "10487"
        },
        {
          "fillIndex": 492,
          "paths": [
            "case_management.asam_criteria.dimension_6.text",
            "case_management.asam_criteria.dimension_6.narrative",
            "case_management.asam_criteria.dimension_6.rationale"
          ],
          "section": "ASAM Criteria",
          "label": "Dimension 6 - Recovery/Living Environment",
          "type": "textarea",
          "dataQnFieldId": "10488"
        },
        {
          "fillIndex": 493,
          "paths": [
            "case_management.safety_planning.additional_safety_planning_needed",
            "case_management.safety_planning.is_additional_safety_planning_needed"
          ],
          "section": "Safety Planning",
          "label": "Is additional safety planning needed?",
          "type": "textarea",
          "dataQnFieldId": "10489"
        },
        {
          "fillIndex": 494,
          "paths": [
            "case_management.safety_planning.why_or_why_not",
            "case_management.safety_planning.rationale",
            "case_management.safety_planning.clinical_explanation"
          ],
          "section": "Safety Planning",
          "label": "Why or why not?",
          "type": "textarea",
          "dataQnFieldId": "10490"
        }
      ],
      "defaultAnswers": [
        {
          "question": "case_management.items.housing.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.housing.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.housing.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.housing.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.financial_stressors.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.financial_stressors.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.financial_stressors.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.financial_stressors.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.legal.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.legal.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.legal.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.legal.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.employment.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.employment.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.employment.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.employment.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.education_vocation.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.education_vocation.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.education_vocation.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.education_vocation.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.independent_living.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.independent_living.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.independent_living.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.independent_living.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.medical.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.medical.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.medical.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.medical.selections.Severe",
          "answer": false
        },
        {
          "question": "case_management.items.social_natural_supports.selections.None",
          "answer": false
        },
        {
          "question": "case_management.items.social_natural_supports.selections.Mild",
          "answer": false
        },
        {
          "question": "case_management.items.social_natural_supports.selections.Moderate",
          "answer": false
        },
        {
          "question": "case_management.items.social_natural_supports.selections.Severe",
          "answer": false
        }
      ],
      "sourcePrompt": {
        "title": "Part 3 Case Management and ASAM JSON prompt",
        "source": "notes/05-31-2026 Promp_3.txt, Prompt3_and_4.txt, ASAM PDFs, and 05-31-26_Part_3.JSON",
        "body": "You are creating structured JSON for Rose's ReliaTrax Biopsychosocial Assessment Part 3: Case Management Assessment.\n\nReturn one valid JSON object only. Do not include markdown, comments, prose outside JSON, or trailing commas. Use the client's first name in narrative fields when known. Write professional clinical language in third person. Avoid em dashes.\n\nUse this exact top-level shape:\n{\n  \"case_management\": {\n    \"items\": {\n      \"housing\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"financial_stressors\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"legal\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"employment\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"education_vocation\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"independent_living\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"medical\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" },\n      \"social_natural_supports\": { \"score\": 0, \"severity\": \"None\", \"rationale\": \"\" }\n    },\n    \"asam_criteria\": {\n      \"dimension_1\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" },\n      \"dimension_2\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" },\n      \"dimension_3\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" },\n      \"dimension_4\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" },\n      \"dimension_5\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" },\n      \"dimension_6\": { \"severity\": 0, \"label\": \"None\", \"text\": \"\" }\n    },\n    \"safety_planning\": {\n      \"additional_safety_planning_needed\": \"No\",\n      \"why_or_why_not\": \"\"\n    }\n  }\n}\n\nFunctioning scoring is strict. Complete every category: Housing, Financial Stressors, Legal, Employment, Education/Vocation, Independent Living, Medical, and Social/Natural Supports. Use score 0 None, 1 Mild, 2 Moderate, 3 Severe. The severity label must match the score. The rationale must be one concise clinical sentence. Score guide: Housing 0 stable, 1 temporary, 2 unstable, 3 homeless. Financial Stressors 0 stable, 1 mild, 2 moderate, 3 no income or basic needs unmet. Legal 0 none, 1 minor, 2 active, 3 severe impact. Employment 0 stable, 1 mild, 2 seeking, 3 not seeking or barriers. Education/Vocation 0 none, 1 mild, 2 moderate, 3 severe. Independent Living 0 independent, 1 mild, 2 moderate, 3 unable. Medical 0 none, 1 mild, 2 moderate, 3 severe. Social/Natural Supports 0 strong, 1 some, 2 limited, 3 none.\n\nASAM Criteria is strict. Complete all six ASAM dimensions. Severity must use 0 None, 1 Mild, 2 Moderate, 3 High, 4 Severe, and the label must match the number. Each dimension text must begin with \"Severity: <number>: <label>\" and then include a 2-4 sentence clinical paragraph. Each paragraph must justify the rating, describe functioning, include risk implications, and support the recommended level of care. Do not inflate severity and do not minimize severity. Use the least restrictive safe level of care logic: Level I Outpatient is generally all 0/1; IOP 2.1 often has low Dimension 1/2 with higher Dimension 4, 5, or 6; residential or inpatient require stronger acute risk or 24-hour clinical structure needs. Sober living is not a clinical level of care.\n\nDimension 1 is Acute Intoxication and/or Withdrawal Potential. Dimension 2 is Biomedical Conditions and Complications. Dimension 3 is Emotional, Behavioral, or Cognitive Conditions and Complications. Dimension 4 is Readiness to Change. Dimension 5 is Relapse, Continued Use, or Continued Problem Potential. Dimension 6 is Recovery/Living Environment.\n\nSafety planning must be individualized. additional_safety_planning_needed must be exactly Yes or No. why_or_why_not must reference SI/HI, withdrawal risk, medical concerns, self-harm risk, violence risk, relapse risk, psychiatric instability, environmental concerns, or the clinically relevant absence of those concerns. Do not use generic safety language.\n\nRole clarity: the clinician assesses, diagnoses, plans, and refers. Do not imply the clinician ensures housing outcomes. Housing decisions belong to sober living staff. The client is responsible for follow-through. Peer support assists connection only.\n\nSUD rule: any SUD history, even remission, qualifies. Sobriety alone does not rule out SUD. If there is no SUD, do not recommend peer services, SUD groups, IOP, or substance programming; use referral-out or non-SUD resources and 30-day transition logic."
      },
      "expectedFieldCount": 536,
      "selector": "textarea, select, input:not([type=\"hidden\"]):not([type=\"submit\"]):not([type=\"button\"]):not([type=\"reset\"]):not([type=\"image\"]), [contenteditable=\"true\"]",
      "onlyVisibleControls": false
    },
    "diagnostics": {
      "title": "Diagnostics Part 4",
      "description": "Rose emailed the current Diagnostics / Clinical Impressions source prompt on 2026-05-25. Field mapping is still pending.",
      "mappingStatus": "pending",
      "fieldMap": [],
      "sourcePrompt": {
        "title": "Part 4 Diagnostics / Clinical Impressions source prompt",
        "source": "Rose Gmail 19e62280dbcee9a0, 2026-05-25 9:40 PM Central",
        "body": "You are completing a Biopsychosocial Assessment (BPS) Part 2, Part 3, and Part 4 based on the transcript provided.\n\nEach section header must appear exactly as written and on its own line. The content for that section must begin after exactly one blank line. Use single line breaks, clean clinical formatting, third person, client first name, and no em dashes.\n\nComplete all six ASAM dimensions with severity number/label, clinical justification, functional impact, and risk implications. Use 0 None, 1 Mild, 2 Moderate, 3 High, 4 Severe.\n\nSafety planning must answer whether additional safety planning is needed and why, referencing SI/HI, withdrawal risk, medical concerns, self-harm, violence, relapse risk, psychiatric instability, environmental concerns, or lack thereof.\n\nAssessment Summary must be 4-5 individualized clinical paragraphs. It must align with ASAM severity, DSM V, clinical recommendations, and level of care. Do not use bullets or mini-headers.\n\nClinical Recommendations must select only appropriate options from Group, Individual, Mental Health, Medical, Case Management, Peer Coaching, Coordination with Other Providers, and Other Services. Other Services must be concise phrases separated by semicolons when selected.\n\nDSM V is strict: include only Substance Use Disorder diagnoses supported by the transcript, with DSM-5 wording and F codes when possible. Do not include PTSD, depression, anxiety, bipolar disorder, adjustment disorder, personality disorders, medical diagnoses, grief, housing, legal, or psychosocial stressors.\n\nLevel of Care must match ASAM severity and use the least restrictive appropriate level. Sober living is not level of care. Outpatient or IOP uses 90 days and an estimated discharge month/year approximately 3 months from assessment. Detox uses 7-10 days plus follow-up outpatient/IOP. Higher LOC uses TBD. No SUD uses referral-out and 30 days."
      }
    },
    "treatment": {
      "title": "Treatment Plan",
      "description": "Rose emailed Treatment Plan rules on 2026-05-23. Field mapping is still pending.",
      "mappingStatus": "pending",
      "fieldMap": [],
      "sourcePrompt": {
        "title": "Treatment Plan source prompt",
        "source": "Rose Gmail 19e55f2a19ecdd27, 2026-05-23 12:46 PM Central",
        "body": "Create a Treatment Plan based on the transcript provided. This treatment plan form is separate from the BPS and Diagnostic/Clinical Impressions form.\n\nUse exact copy/paste-ready EHR formatting. Every section header appears alone on its own line, followed by exactly one blank line before content. Use professional clinical language, third person, the client first name, and no em dashes. Do not use bullets except for the required numbered Objective and Therapeutic Intervention lists.\n\nAssessment Date must exactly copy Date of Service Plan.\n\nStrengths must be one individualized 4-6 sentence clinical paragraph. Risk Factors must be one individualized 5-8 sentence paragraph supporting medical necessity when applicable.\n\nEach problem must contain exactly 1 Goal, 3 Objectives, and 3 Therapeutic Interventions. Objectives and Therapeutic Interventions must be numbered 1. 2. 3., each as one complete sentence. Therapeutic Interventions should usually begin with Clinician will.\n\nReview/Comments should be left blank unless specifically instructed."
      }
    },
    "quicknotes": {
      "title": "QuickNotes / Group Notes",
      "description": "Fill Rose QuickNotes / Group Notes from the 2026-05-25 discovery map.",
      "mappingStatus": "mapped",
      "configUrl": "https://raw.githubusercontent.com/zachbush96/Rose-Form/refs/heads/main/github-data/rose-quicknotes-config.json"
    },
    "discovery": {
      "title": "Discovery and Mapping",
      "description": "Scan unknown ReliaTrax or similar forms and export a mapping package for Zach."
    }
  },
  "releaseNotes": [
    "v0.1.6 maps Case Management and ASAM Part 3, adds the structured JSON source prompt, and enables Functioning, ASAM Criteria, and safety planning fill.",
    "v0.1.5 prevents MSE normal/default checkboxes from being combined with Other or abnormal selections, including hallucinations None evidenced with Auditory/Command/Other.",
    "v0.1.4 maps MSE Part 2 from MSE_Full_Form.JSON and enables Fill active page for Appearance through Judgment.",
    "v0.1.3 adds structured MSE Part 2 default answers from Email_1.txt and exposes them to the MSE fill runtime.",
    "v0.1.2 marks every non-BPS workflow mode with remote-owned mapping status and fieldMap storage, so the side panel can refresh prompts and mapping metadata from GitHub.",
    "v0.1.1 expands MSE Part 2 into screenshot-aligned JSON output covering Appearance through Judgment.",
    "v0.1.0 keeps workflow-mode labels, source prompts, and per-mode remote config URLs outside sidepanel.js."
  ]
};
