# Gameful Learning Product Principles

Status: durable product-planning guidance for Number Quest and future child-learning products.

Sources synthesized:
- Yu-kai Chou, *Actionable Gamification: Beyond Points, Badges, and Leaderboards* / 《遊戲化實戰全書》
- Yu-kai Chou & Mark Diaz, *10,000 Hours of Play: Unlock Your Real-Life Legendary Success* / 《一萬小時的遊戲》

This document is not a request to maximize engagement. It is a constraint on how motivation design may be used in learning products.

## 1. Prime directive: learning first, motivation in service of learning

The product win state is not time-on-app, streak length, questions answered, DAU, points, badges, or collectibles.

The learning win state is:

> A child could not yet do something, becomes able to do it independently, can still retrieve it after time has passed, and can transfer the same mathematical relationship to a different surface context.

Engagement metrics are useful only when they help produce that outcome.

## 2. Human-Focused Design, not PBL decoration

Borrow the central lesson of *Actionable Gamification*: design around why a child wants to act, not around adding Points / Badges / Leaderboards to a worksheet.

Rules:
- rewards follow meaningful learning progress; they do not substitute for it;
- a badge without a real challenge has little learning meaning;
- never make repetitive low-value work attractive only by increasing external rewards;
- every proposed game mechanic must state which learner motivation or learning behavior it supports.

## 3. Prefer White-Hat motivation for children

Prioritize motivations that leave the child feeling more capable, autonomous, curious, connected, and proud of real growth.

Strongly prefer:
- Development & Accomplishment
- Empowerment of Creativity & Feedback
- Epic Meaning / meaningful purpose, used lightly and authentically
- Ownership & Possession tied to genuine progress
- Curiosity / Unpredictability in content and discovery
- Relatedness without comparison pressure

Keep Scarcity, Loss & Avoidance, and other coercive mechanics low.

Do not use:
- streak-loss anxiety;
- expiring learning rights;
- lives that block learning after mistakes;
- overdue / debt framing for review work;
- red-deficit shame;
- manipulative scarcity;
- randomized reward loops designed like gambling;
- child leaderboards or rank pressure as a default mechanism.

## 4. Design the player journey, not isolated mechanics

Evaluate Discovery → Onboarding → Scaffolding → mature/endgame experience.

For Number Quest:
- Discovery: make the child curious enough to begin an adventure.
- Onboarding: teach interaction and learning rules with early success, not fake difficulty.
- Scaffolding: the daily core loop must remain intrinsically satisfying over many sessions.
- Mature experience: mastery, transfer, long-term retrieval, new combinations, and ownership should replace endless reward inflation.

## 5. Creativity and agency are the next major motivation opportunity

Current answer selection should gradually evolve toward bounded learner agency.

Examples:
- let the child choose a strategy after a miss: number line, decomposition, equal groups, inverse relationship;
- let multiple valid solution approaches coexist;
- give immediate feedback about the chosen strategy, not just correctness;
- reward discovery and independent recovery more than passive hint consumption.

Productive struggle remains non-negotiable: Challenge → struggle → hint/strategy choice → discovery → mastery.

## 6. Curiosity should live in content, not addictive reward randomness

Use unpredictability through:
- varied story worlds;
- different semantic relationships for the same skill;
- surprising but bounded mission sequences;
- new representations and transfer contexts;
- discoveries in the child’s own mastery map.

Avoid using uncertainty primarily to make rewards compulsive.

## 7. Ownership should mean “my growing capability,” not “my pile of tokens”

Collections and worlds are useful when they externalize authentic progress.

Prefer:
- skill map regions lighting up after demonstrated mastery;
- a world built by capabilities the child has actually retained;
- collections connected to meaningful quests or discoveries;
- light customization that increases ownership without distracting from learning.

Avoid rewarding volume alone.

## 8. The 10K HP alignment model for learning-product design

*10,000 Hours of Play* reframes long-term mastery as a game worth playing, organized around six aligned elements:

1. Game / Mission
2. Attributes / Talents
3. Role / Identity
4. Skills / Craft
5. Allies / Network
6. Quests / Milestones

Translate this carefully for children; do not turn dynamic learning behavior into fixed talent labels.

### Game / Mission
A session should feel like a meaningful mission, not “complete 20 exercises.” The mission gives purpose to practice.

### Attributes
Use observed learning state, preferences, confidence, representation strengths, and recent struggle patterns to personalize. Treat these as changing signals, not permanent identities such as “a weak math child.”

### Role / Identity
Support constructive identity: “I can be a number explorer / builder / detective” rather than grade labels or fixed ability labels. Identity should emerge from actions and choices.

### Skills
Make real capability progression legible. Skill growth includes first acquisition, independent retrieval, transfer, and retention—not only immediate accuracy.

### Allies
Parents, teachers, siblings, and AI should act as allies who enable the child to succeed independently. They should not replace the child’s thinking or become surveillance/ranking systems.

### Quests
Break long learning journeys into bounded, meaningful missions with visible progress and feedback. Quests should connect upward to the larger learning mission.

## 9. Alignment matters more than any single mechanic

The six 10K HP elements should reinforce one another:

Mission → learner state/attributes → chosen role/identity → skills → supportive allies → quests → feedback → updated learner state.

A feature is suspect when it is locally engaging but conflicts with the larger mission. Example: a streak mechanic can increase daily return while decreasing autonomy and willingness to return after a missed day.

## 10. The journey itself must be rewarding

Do not design the product so all value is deferred until mastery or completion.

A child should experience worthwhile moments while still struggling:
- curiosity;
- choosing a method;
- seeing a relationship become clearer;
- recovering after a miss;
- recognizing something from a prior day;
- noticing that a once-hard skill now feels easy.

This reduces dependence on willpower and external rewards, echoing the central idea of turning long practice into play rather than grind.

## 11. Product metrics hierarchy

When metrics conflict, prioritize in this order:

1. learning correctness and safety;
2. independent mastery and retention;
3. transfer across contexts/representations;
4. learner autonomy and willingness to return;
5. healthy engagement;
6. cosmetic reward consumption.

Never optimize #5 or #6 at the expense of #1–#4.

## 12. Number Quest roadmap implications

### v0.8 — Story Variety + Transfer
Already aligned with these principles: use curiosity and semantic variety to test transfer, not merely to make copy less repetitive.

### v0.9 — Adaptive Learning Journey + Motivation Architecture
The adaptive engine should answer two questions together:
1. What is the highest-value next learning experience?
2. How should that experience be framed so the child still wants to continue voluntarily?

Potential bounded scope:
- adaptive sequencing across challenge / retrieval / confidence / novelty / mastery;
- strategy choice after errors;
- lightweight session mission choice;
- learner-state-based personalization without fixed ability labels;
- meaningful progress feedback rather than reward inflation.

### v1.0 — Complete Daily Learning Product
A child can independently enter, understand today’s mission, learn, struggle productively, recover, retain, transfer, see authentic progress, and willingly return later.

A v1.0 success criterion should include:
- independent use without a parent operating the UI;
- meaningful daily 10–20 minute experience;
- delayed retrieval evidence;
- transfer evidence;
- no coercive engagement mechanics;
- parent visibility that informs without ranking or shaming.

## 13. Feature review checklist

For every future gameful feature, ask:
1. What learning behavior does this improve?
2. Which human motivation does it serve?
3. Is that motivation primarily empowering or coercive?
4. Can the child game the reward without learning?
5. Does it preserve productive struggle?
6. Does it increase agency, competence, curiosity, relatedness, or meaningful ownership?
7. Does it create pressure, anxiety, comparison, or artificial scarcity?
8. Does it strengthen the Game → Attributes → Role → Skills → Allies → Quests alignment?
9. Would we still want this feature if retention metrics were hidden from us?
10. How will we test that learning, not merely engagement, improved?

## 14. Durable principle

> Build a game worth learning through, not a learning task wrapped in game rewards.

And for long-term mastery:

> The goal is not to make a child grind for 10,000 hours. The goal is to make meaningful growth feel enough like play that sustained practice becomes something the child is willing to choose.

## References

- https://yukaichou.com/gamification-examples/octalysis-gamification-framework/
- https://www.oreilly.com/library/view/actionable-gamification/9781839211706/Text/toc.xhtml
- https://yukaichou.com/10khp/
- https://yukaichou.com/10000-hours-of-play-book/
