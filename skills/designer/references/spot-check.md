# The spot check

Contents: 1. What it is for · 2. Procedure · 3. The delegation message · 4. Escalation · 5. Limits

`<scripts>` below means the skill's scripts directory (`${CLAUDE_SKILL_DIR}/scripts`, the absolute path shown in SKILL.md).

## 1. What it is for

The cheapest tier: one short `design-spot-check` call (Sonnet, well under a minute) at the end of any task that changed a screen, so that a design that was pushed to a 9 does not quietly slide back to a 6 over the next twenty tickets. It compares the new screenshot with the previous one, tallies the brief's rules if there is a brief, and gives at most two nudges. It never scores. Measured (design-director, 2026-09-11): Sonnet picked the better of twenty known before-and-after pairs 20 of 20 times with no position bias, but its absolute scores on identical input ranged from 1 to 7 in one run. So it judges pairs, never numbers.

Run it as `/designer spot`, or make it automatic by adding one line to the project's CLAUDE.md: "After any change to a user-facing screen, run /designer spot before reporting done."

## 2. Procedure

1. Screenshot the surface at the viewport it was last shot at: `node <scripts>/screenshot.mjs <url-or-file> --out design/shots/<slug> --name spot-<date> --viewports desktop --no-full --critic-copy` (add `mobile` when the surface is mobile-first). Look at it yourself first; a clipped label or a missing font is a bug to fix before spending anything.
2. Find the previous screenshot of the same surface in the design record (the last spot row or the last critic round; those are the round-named files, e.g. `design/shots/<slug>/r4-desktop-top.png`). If there is none, skip the pairwise step.
3. Copy the new neutral shot and the previous round-named shot into one fresh folder under `design/shots/<slug>/.critic/` as `a.png` and `b.png`, assigning A and B at random and noting which is which. Invoke a fresh `design-spot-check` subagent with the Agent tool, in the foreground, with the message in section 3 using absolute paths, and map the verdict back afterwards.
4. Log one row in the record's spot log: date, surface, pair verdict and margin, rules passed, top nudge, applied or not, screenshot path.
5. Apply the top nudge if it is a one-line change; otherwise leave it logged.

## 3. The delegation message

```
Spot check of a <marketing page | app screen | ...> that was just changed.
Aesthetic statement: "<one sentence>"
Screenshot A: /abs/path/to/design/shots/<slug>/.critic/<token>/a.png
Screenshot B: /abs/path/to/design/shots/<slug>/.critic/<token>/b.png
(Open only these two files.)
Reference brief (optional):
--- brief ---
<brief text verbatim>
--- end ---
Answer in your standard format.
```

## 4. Escalation

Escalate to a Review (`/designer iterate`) when any of these is true:
- the pairwise verdict is "worse" with a clear margin;
- a rule that passed in the last logged row now fails;
- the same nudge has been logged three times without being applied.

Otherwise the spot check is the last row before "done".

## 5. Limits

- Pairwise is reliable for iterations of one direction. It cannot choose between two directions; that is the user's call in Discover, informed by the scoring critic.
- No score, ever. If someone wants a number, that is a critic round.
