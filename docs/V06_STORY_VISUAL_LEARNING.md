# Number Quest v0.6 — Story + Visual Learning

## Status
DRAFT. Implement only on `feat/v0.6-story-visual-learning`. Do not merge or promote `beta` / `main` without explicit founder approval.

## Product objective
Move Number Quest from mostly symbolic arithmetic toward mathematical understanding:

Read situation → identify relationship → choose a method → productive struggle → visual clue → solve independently.

The child should still feel that they are playing an adventure, not doing worksheets.

## V06-A — Story Missions
Add a child-facing Story Mission mode using deterministic templates, not an LLM.

Supported families:
- addition within the currently eligible arithmetic range
- subtraction within the currently eligible arithmetic range
- multiplication only for multiplication families already exposed in learning history
- division only for `eligibleDivisionSkills()` families

Examples:
- `你有 37 顆寶石，又找到 28 顆。現在有幾顆？`
- `火箭有 73 點能量，用掉 26 點。還剩多少？`
- `每個寶箱放 7 顆星星，6 個寶箱共有幾顆？`
- `42 顆星平均放進 7 個寶箱，每箱幾顆？`

Constraints:
- one unambiguous mathematical interpretation
- no irrelevant numbers
- no trick wording
- no remainder / fractions / decimals
- arithmetic <= 100 in v0.6
- answer options remain unique and valid
- story text should be short enough for a 7-year-old reader

## V06-B — Visual Hint Engine
Wrong answers should trigger a small visual clue, not an answer reveal.

Minimum visual models:
- addition/subtraction: number line or tens/ones decomposition
- multiplication: equal groups / simple array
- division: equal grouping derived from the matching multiplication fact
- make-10 / make-100: tens decomposition

Hint ladder:
1. first miss: contextual text + lightweight visual model
2. retry
3. if still wrong: stronger visual organization is allowed, but do not reveal the final answer
4. existing spaced revisit contract still applies

The visual hint must represent the actual generated problem rather than a generic decoration.

## V06-C — Read Aloud
Add a `🔊` control on story prompts using browser `speechSynthesis` when available.

Constraints:
- no external API or account
- graceful fallback when speech synthesis / a Chinese voice is unavailable
- do not auto-play audio
- speaking must not block answering or navigation
- avoid duplicate simultaneous speech on repeated taps

## V06-D — Learning integration
Story questions are not a separate fake curriculum. They must map to existing skill keys and update the same v0.5 learning history, scheduler, mastery and spaced-review system.

A missed story question must be eligible for a later spaced revisit. A later review may use the same semantic problem; exact wording may remain identical for v0.6.

## State / compatibility
- Keep `nq-state-v05` unless a schema change genuinely requires a v0.6 namespace. Prefer backward-compatible extension over unnecessary migration.
- If schema changes, provide explicit migration and never mutate old state in place.
- Use a distinct v0.6 service-worker cache if product assets change materially.
- Do not collect child name, account data or cloud analytics.

## Acceptance criteria
- deterministic story generators are unit-testable
- all story arithmetic respects eligibility and curriculum bounds
- all choices have exactly one valid answer
- division stories never use unexposed division families
- visual hints are mathematically consistent with the exact question
- visual hints never expose the final answer directly
- story misses still enter the existing spaced-review loop
- read-aloud works when supported and fails gracefully when unsupported
- iPad portrait/landscape and Surface touch flows pass
- 5 / 10 / 20 normal modes and existing v0.5 behavior remain intact
- protected Vercel preview is READY before review

## Explicit non-goals
- no open-ended natural-language grading
- no LLM-generated stories
- no multi-step word problems yet
- no fractions / decimals / long division
- no school grade-level labels
- no leaderboard or child comparison
