# BPS configuration changelog

## 0.4.9 - 2026-08-07

- Add a Prompt 1 completeness check that preserves all required substance blocks and top-level sections.
- Require balanced braces and a complete parseable object rather than allowing truncated JSON.
- Harden Prompt 2 to require `attempt_dates_and_methods` and `future_attempt_triggers` in every response.
- Explicitly forbid the retired `attempt_dates` and `attempt_methods` output keys.
- Keep runtime normalization for responses saved before the combined-key migration.
