# v0.3 Retention Loop

Status: implementation branch only. **Do not merge to main while v0.2 is in active kid dogfood.**

## Goal
Increase voluntary return rate without turning Number Quest into homework.

## Included
- Daily quests: one run, 5-combo, 15 correct answers.
- Boss cadence: every third run in each world becomes a 7-hit boss fight.
- Collection book: 16 normal + 4 rare boss collectibles.
- Adaptive question weighting: missed skill families become more likely; mastered families decay.
- Separate localStorage key `nq-state-v03`, so v0.3 preview cannot overwrite v0.2 progress.
- No login, child name, cloud sync, leaderboard, ads, or personal data.

## Acceptance
- v0.2 main/PWA stays unchanged by this branch.
- Add/sub stay within world bounds and subtraction never goes negative.
- Multiplication factors stay within each world's contract.
- Daily rewards are claim-once per local day.
- Boss reward produces a rare collectible.
- Wrong skill weight rises; first-try correct weight decays.
