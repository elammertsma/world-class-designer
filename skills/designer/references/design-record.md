# Design record template

Create `design/DESIGN-RECORD.md` at the start of a run and keep it current. It exists so that a later session, a teammate, or a future model can continue without re-deriving anything, and so that failed ideas are kept rather than lost: a prompt that a model could not execute today is often a great result next year.

```markdown
# Design record: <product or page>

Status: <interviewing | exploring | building | critic loop | media | delivering | porting | shipped>
Next step: <the step the next session should start at>
Last updated: <date>

## Brief
Product and audience: <one or two lines>
Surfaces: <one line each: page or screen, with route or file>
Emotional target: <what the first three seconds should feel like>
Taste anchors: loves <...> | tacky <...>  (quote the user's words)
Risk dial: <1-5>
Constraints: <brand assets, device priority, stack, deadlines>

## Reference brief
Inspiration set: <design/references/... with one line each on what it is and what it is here for>
Brief: <design/briefs/<slug>.md> | none (declined by the user on <date>)
Source: images | current page | both · palette: code (<file>) | images · model: <...> · date: <...> · hash: <12 chars>
Kept elements (confirmed by the owner): <one line each>
(Regenerating the brief starts a new baseline; scores across briefs are not comparable.)

## Seed
String: <seed string, recorded here only, never in the design>
Rolls: <era, material, color, type, layout, motion, imagery, density, wildcard>
Seeded direction: <name>

## Directions considered
| # | Name | One line | Source (anchor / seed / terrible / collision) | Built? | Median score | Status (chosen / parked / rejected) | Why (the user's words) |
|---|------|----------|-------------------------------------------------|--------|--------------|--------------------------------------|------------------------|

## Chosen direction
<paste the Direction Brief>

Build prompt:
<the concise prompt used to build the first proof of concept>

Aesthetic statement (given to every critic): "<one sentence>"

## Baseline
One row per surface: the median of the last accepted scored round, valid only for that configuration.
| Surface | Baseline (median) | Rules passed | Brief hash | Critic model | Date | Set by (round) |
|---------|-------------------|--------------|------------|--------------|------|----------------|

## Critic rounds
Score is the median of three critics; spread is min-max; rules passed is the brief's tally and never feeds the score.
| Round | Date | Screenshots | Median (spread) | Rules passed | Verdict | Top gaps | What changed after |
|-------|------|-------------|-----------------|--------------|---------|----------|--------------------|
| r0 | | design/shots/<slug>/r0-* | | | | baseline | |

Stopped because: <reached target / six rounds / two rounds without a full point / user said stop>
Gate: <median (spread)> on <date> -> <ship / continue>

## Spot log
One row per spot check; the pair verdict compares against the previous row's screenshot.
| Date | Surface | Pair verdict (better / same / worse, margin) | Rules passed | Top nudge | Applied? | Screenshot |
|------|---------|-----------------------------------------------|--------------|-----------|----------|------------|

## Media
| File | Kind | Model | Prompt (verbatim) | Refs | Notes |
|------|------|-------|-------------------|------|-------|

Video: <generated | skipped: no FAL_KEY | not needed>

## Subtraction log
<what was removed and what would have broken if it stayed (usually nothing); one line each>

## States
| State | Screenshot | Notes |
|-------|------------|-------|
| Default | | |
| Empty | | |
| Loading | | |
| Error | | |
| Partial | | |
| Nothing to do | | |

## Lighthouse
Accessibility is a gate at 90; the other three are reported.
| Surface | Date | Perf | A11y | Best practices | SEO | Fixed after run | Report |
|---------|------|------|------|----------------|-----|-----------------|--------|

## Rejected prompts to retry with a future model
| Prompt (short) | Model tried | Date | What went wrong | Retry when |
|----------------|-------------|------|-----------------|------------|

## Open questions
<decisions deferred to the user, or things the critics kept flagging that the owner chose to keep>

## Handoff
Tokens: <colors, type scale, spacing scale, radii, motion durations and easings>
Signature moves: <the three, and where they live in the code>
Never "clean up": <choices that look like mistakes but are the design>
Port notes: <where things live in the codebase, what differs from the prototype>
```

Keep entries short. The record is a log, not an essay.
