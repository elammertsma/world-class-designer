# The critic loop

Contents: 1. Why separate critics · 2. What to pass and what to withhold · 3. The delegation message · 4. Screenshot sets · 5. Reading three critiques · 6. Choosing what to fix · 7. Stopping rules and the gate · 8. Baselines and comparability · 9. The critic's own bias · 10. Models and cost · 11. Recording rounds

`<scripts>` below means the skill's scripts directory (`${CLAUDE_SKILL_DIR}/scripts`, the absolute path shown in SKILL.md).

## 1. Why separate critics

An agent cannot evaluate its own design. It remembers every decision as reasonable, so it defends the whole instead of zooming out, and it grades its own improvement instead of the result. A critic in a fresh context has no memory of the reasoning, only the pixels, which is also what users have. The critic is a separate subagent (`design-critic`, in `~/.claude/agents/`) with only the Read tool, no CLAUDE.md, and the strongest available model, because design judgment improves with model strength while implementation does not need it.

Three critics per round, not one. On a bench of eleven real sites (design-director, 2026-09-11), single Opus scores stayed within a point across repeats on 8 of 11 samples; Sonnet managed 4 of 11 and ranged from 1 to 7 on one sample. A single number is noise you cannot separate from progress; the median of three is stable enough to drive stopping rules, and critics are the cheap part of a round.

## 2. What to pass and what to withhold

Pass:
- The neutral screenshot copies for this round (the `criticFiles` printed by `screenshot.mjs --critic-copy`; see section 4).
- The aesthetic statement: one sentence from the Direction Brief. For a baseline of an existing page, "none stated; judge the aesthetic the page appears to attempt".
- The emotional target and the audience, one line.
- The kind of surface: marketing page, app screen, dashboard, onboarding.
- The reference brief text, verbatim, if the surface has one (`references/reference-brief.md`).

Withhold, because each one biases the score:
- Code, diffs, file names of components, the framework.
- The round number, previous scores, previous critiques, the target score, the baseline. This is why the critic gets the neutral copies: `r3-desktop-top.png` tells it there were three rounds.
- The inspiration images. Critics dismiss photographs as moodboards and translate them inconsistently; the brief is the anchor.
- Your own opinion of the design, what you just changed, or what you are unsure about.
- The seed and the direction's "signature moves" list. Asking "did you notice X?" invites the critic to see it.

Never resume a previous critic with SendMessage; a critic that remembers its last critique grades consistency with itself, not the work. Never edit the critic's instructions between rounds to steer it; put steering into the implementer's work instead, or the scores stop being comparable.

## 3. The delegation message

Use the Agent tool with `subagent_type: "design-critic"`, three calls in one turn so they run in parallel, in the foreground, each with this identical message and nothing more:

```
Critique these screenshots of a <marketing landing page | app screen | ...> for <audience>.
Aesthetic statement: "<one sentence>"
Emotional target: <one line>
Screenshots (read every one; open only these files):
- /abs/path/to/design/shots/<slug>/.critic/a91f3c/desktop-top.png      (desktop, first screen)
- /abs/path/to/design/shots/<slug>/.critic/a91f3c/desktop-scroll1.png  (desktop, second screen)
- /abs/path/to/design/shots/<slug>/.critic/a91f3c/desktop-full.png     (desktop, whole page, small)
- /abs/path/to/design/shots/<slug>/.critic/a91f3c/mobile-top.png       (mobile, first screen)
- /abs/path/to/design/shots/<slug>/.critic/a91f3c/mobile-full.png      (mobile, whole page, small)
Reference brief (optional; when present, report the rules check separately from the score):
--- brief ---
<brief text verbatim>
--- end ---
Answer in your standard format.
```

The `criticFiles` the screenshot script prints are absolute paths; pass them as printed (the subagent's Read tool needs absolute paths) and check that the files exist first.

## 4. Screenshot sets

Per round, from `<scripts>/screenshot.mjs`, with `--name r<N> --critic-copy`:
- Desktop first screen (`-top`) and one or two scroll positions (`--scroll 3`): the first screen decides the first impression; the scroll shots show the sections at real scale.
- A whole-page capture (`-full`) for structure and rhythm. A long page's full capture is downscaled by the model before it is seen, so it shows proportion, not detail; that is what it is for. Keep the set to about eight images per critic.
- Mobile first screen and whole page. Mobile is where squashed designs get caught.
- After adding media or motion, add `--scroll 4` and, when there is a dark variant, `--dark`.
- For interaction states (hover, open menus, filled forms, empty and error states), screenshot with the state applied in the HTML (a query parameter or a class you toggle) rather than describing it to the critic.

The round-named files stay in `design/shots/<slug>/` for the record; the `.critic/<token>/` copies are what the critics get. Look at every screenshot yourself first. If something is broken, fix it and re-shoot before spending a round.

## 5. Reading three critiques

- Score: the median of the three. Log the spread (min to max). A spread of three or more points means the screenshots or the aesthetic statement are ambiguous; look at both before the next round.
- Gaps: take the ranked gaps from the median-scoring critique; where the other two agree on a gap it missed, add it.
- Rules check (with a brief): a tally, one row per round. It never feeds the score and is never treated as one.
- INTENT ADHERENCE disagreeing with the stated aesthetic two rounds running means the direction, not the polish, is the problem.
- KEEP items from all three are protected next round.

## 6. Choosing what to fix

- Apply the top three to five gaps completely rather than ten things halfway. Half-applied fixes create new gaps.
- Fix every generated-looking pattern and every accessibility flag the critics list; those are checklists, not opinions.
- Treat each gap as a diagnosis, not a prescription. "Add a testimonial section" usually means "nothing here earns belief"; ask whether removing or restructuring solves the same gap before adding anything. An added element is next round's tell.
- Read the top gap's altitude. Composition and structure first; a polish round cannot move a structural score. Later rounds: type details, spacing, states, copy.
- If the gap is missing imagery, the fix is the media step, not more CSS.
- Protect the KEEP items. A fix that removes something the critics praised is a regression even if it addresses a gap.
- When the verdict is RETHINK, do not polish. "RETHINK: structure" means the direction holds but the page must be recomposed: go back to the layout logic and signature moves in the brief and rebuild the composition. "RETHINK: direction" means the concept is not working: write the abandoned build prompt into the record's rejected-prompts table with the model and date, and tell the user before choosing another direction.
- When a critique conflicts with the user's stated taste or a kept element, the user wins; note the conflict in the record.

## 7. Stopping rules and the gate

Iteration without stopping rules never ends, and an agent left alone will keep polishing forever. Defaults (the user can change them by saying so):
- Full run: stop at a median of 9 or above, or after six rounds, or when the median has not gained a full point in two consecutive rounds.
- `iterate` on an existing surface: stop when the median is at least a point above the surface's baseline, or after two rounds without a full point; report the history and the remaining gaps, and continue only if the user asks.
- Regression: if the median drops by two or more, revert to the previous round's file and reconsider the fixes applied.
- Never tell a critic the target or the baseline.

The gate, run once at the end of Deliver: screenshot the finished design and run one more triple round. Ship when the median is at or above the target and the spread is two points or less. If it fails, apply the shared gaps, re-shoot, run it once more, then report to the user either way. The gate is what makes the final number trustworthy.

## 8. Baselines and comparability

A surface's baseline is the median from the last accepted scored round, recorded with the critic model and the brief hash. Scores compare only within one configuration; a new brief, a new critic model, or an edit to the `design-critic` agent file starts a new baseline row, and the record says so. `spot` rows compare screenshots pairwise instead of scoring, so they do not touch the baseline.

## 9. The critic's own bias

Left alone, the scoring critic favors ruled, editorial, typographic work and will prescribe editorial moves for a dark, photographic or dense technical intent. Its prompt tells it so and tells it to judge the stated intent, but the counterweight is yours: write the aesthetic statement deliberately, and give it the brief when the direction is far from editorial. A ruled direction that wins a shoot-out by less than a point has not really won.

## 10. Models and cost

- Scoring critics: the strongest model available (`model: fable` in the agent file; change to `opus` if a critic call fails because Fable is not available on the account). Never `sonnet` for a score.
- Brief writer: the strongest model, once per surface.
- Spot check: `sonnet`, pairwise only, never a score.
- Implementation: the session model; parallel proof-of-concept builds on `general-purpose` subagents, two at a time at most.
- A scored round costs one screenshot set plus three critic calls; the gate is one more round. Say so before starting a long loop, and stop at the maximum rather than quietly continuing.

## 11. Recording rounds

After each round, append to `design/DESIGN-RECORD.md`:

```
| r3 | 2026-09-18 | design/shots/<slug>/r3-* | 7 (6-8) | 3/5 | POLISH | hero type fights eyebrow; sections all one rhythm; ... | set eyebrow 11px caps, removed section badges, ... |
```

Record the gate on its own line and update the baseline row. The table is what lets the next session (or a future model) continue without re-deriving anything.
