# Number Quest engineering contract

## Product truth
Number Quest is a touch-first math adventure for young children. The child should feel that they are progressing through a game, not taking a worksheet.

## Non-negotiables
- Multiplication uses factors 1–9.
- Addition stays within 100 where specified.
- Subtraction never produces a negative answer.
- Wrong answers do not remove lives, XP, stars, or prior progress.
- Core play works without an account, backend, API key, or network after first load.
- Progress is local to the device.
- iPad Safari and Surface Pro Edge are first-class targets.

## Workflow
Human + ChatGPT define WHAT/WHY and acceptance criteria. GitHub main is shared product truth. Codex should work on bounded branches, validate behavior, open a PR, and hand the PR to ChatGPT for review/repair. Do not silently broaden scope.