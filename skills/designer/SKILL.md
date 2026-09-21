---
name: designer
description: >-
  Turn a website or app design idea into a distinctive, studio-quality design instead of the
  generic "AI look". Use this whenever the user wants to design, build, restyle or redesign a
  landing page, marketing site, portfolio, app UI, dashboard, onboarding flow or any screen and
  cares how it looks and feels (words like design, landing page, hero, UI, look and feel,
  beautiful, unique, stand out, not generic, world-class, premium, brand, visual identity,
  "make it pop"), even when they only say "build me a page for X". Runs the full loop; taste
  interview, seeded direction exploration, HTML prototypes, screenshot-only critic subagents
  (three per round, median score), a cached reference brief from inspiration images, Gemini
  image and fal.ai video generation, then a subtraction pass that removes AI tells, a states
  pass and a Lighthouse accessibility gate. Also use for "critique my design", "why does this
  look AI-generated", "make this less generic", "iterate on the design", "spot check this
  screen", or "has this design slipped".
argument-hint: '[what to design, e.g. "landing page for my productivity app" | explore | iterate | spot | brief | media | tells | port]'
allowed-tools: Bash(node *)
---

# Designer (world-class-designer)

Keep this file as standing instructions for the whole task, not a one-time checklist. The process follows Anshu Chimala's "How to turn your AI into a world-class designer"; the critic protocol also uses measurements published by the design-director project (see `references/critic-loop.md`).

## Why this process exists

A language model's natural move is the most predictable choice at every step: the purplish gradient, text left and graphic right, three feature cards, the same rounded buttons, a sparkle icon. That is the opposite of great design, which is a specific point of view executed with restraint until it produces an emotional response. The model's capability is not the limit; steering taste is. So this skill steers, in three phases:

1. Discover: force variety with randomness from outside the model, ambitious prompts and ideas that sound like they won't work, and inject the user's taste.
2. Define: build, then let critics with fresh eyes push the work to studio quality; replace gradients-and-shapes with real imagery and motion.
3. Deliver: subtract everything that does not earn its place, remove the tells that make work look generated, design the states, and pass the mechanical checks.

Cheap implementer plus strong critics plus media tools raises quality without exploding cost. You are the implementer and the orchestrator; `design-critic`, `design-brief-writer` and `design-spot-check` are the subagents.

## Standing rules

- The user supplies taste; you supply process and craft. When taste is missing, ask for it (Step 1). Never fill the gap with defaults; that is how generic work happens.
- Randomness comes from outside the model. Use the seed script; never "imagine" a random string or do the roll arithmetic yourself. Never reveal the seed in the design, the copy, or file names. The design record is the only place it is written down.
- Critics never see code, diffs, round numbers, previous scores, previous critiques, or the inspiration images. Every critic is a fresh subagent via the Agent tool; never resume one with SendMessage. Hand critics the neutral copies the screenshot script makes with `--critic-copy`, so file names reveal nothing.
- Scores are only comparable within one configuration: same critic prompt, same critic model, same brief. Changing any of them starts a new baseline; say so in the record.
- Screenshots are the truth. Look at every screenshot yourself before handing it to a critic. Never describe or judge a design you have not seen rendered.
- A critique is a diagnosis, not a prescription. When a critic says "add a section", ask whether removing or restructuring something solves the same gap; an added section is next round's tell. Prefer removing to adding.
- Real content only: the real product name, real copy written in the direction's voice, real numbers or none. Lorem ipsum and invented stats are tells.
- Keep `design/DESIGN-RECORD.md` current (template in `references/design-record.md`). It is how the next session picks up, and where rejected ideas wait for a better model.
- Media is optional infrastructure: images need `GEMINI_API_KEY`, video needs `FAL_KEY`. If a key is missing, say so in one line and continue without it. Never block the loop on a key or send the user off to create one mid-task.
- Boldness never excuses broken usability: readable contrast, visible focus states, sensible touch targets, `prefers-reduced-motion` respected, images sized for the web. Lighthouse checks the mechanical part before sign-off.
- Resource budget: at most two implementer subagents at a time; critics are cheap and run three in parallel. One browser per screenshot run (the script opens and closes its own); never launch a browser from an agent prompt.
- Scripts live in `${CLAUDE_SKILL_DIR}/scripts`. The reference files write `<scripts>` for that directory; always run them with the full path, from the project root, so relative output paths land in `design/`.
- The three subagents are `design-critic`, `design-brief-writer` and `design-spot-check`. When this skill was installed as a plugin they appear as `world-class-designer:design-critic` and so on; use the names exactly as they appear in your list of available agent types.

## Step 0: Orient

1. Run `node "${CLAUDE_SKILL_DIR}/scripts/check-env.mjs"`. It reports whether image generation, video generation and screenshots are available, and warns if an `.env.agents` file is not gitignored. Do not ask the user for anything this script can tell you. If it exits with code 3, screenshots are impossible and so is the loop: give the user the install line it printed and stop at the end of Step 0; every later step screenshots.
2. If `design/DESIGN-RECORD.md` exists, read it and continue from the step it points at, with its baseline, brief and aesthetic statement.
3. Read the mode from `$ARGUMENTS`: `explore`, `iterate` (or `critique`, `review`), `spot` (or `check`), `brief`, `media` (or `images`), `tells` (or `polish`), `port`. Anything else is a design idea, so run the full flow. Modes are described at the end.
4. Say what the run will cost before starting it, in one line, so the user can pick a lighter tier: a full run is an hour or two of agent time with twenty or so critic calls on the strongest model (three per scored round); `iterate` is two to four rounds; `spot` is one cheap call. Do not run a full redesign because it seems warranted; the user chooses.
5. If the user is pointing at an existing page or app, screenshot it and run one critic round before changing anything, with the aesthetic statement "none stated; judge the aesthetic the page appears to attempt". That baseline makes improvement measurable and shows the user what the critic sees.
6. Create `design/` with `explorations/`, `shots/`, `assets/`, `references/`, `briefs/` and `audits/`, and start the design record.

## Step 1: Interview (Discover)

Ask only what the brief does not already answer, in a single AskUserQuestion round of at most four questions with at most four options each. Every question exists because it changes the output; the answers become the aesthetic statement the critics judge against.

1. Feeling. "When someone lands on this, what should they feel in the first three seconds?" Options like: serious craft (trust, precision); fun, I want to play; calm, I can breathe; whoa, I have never seen this before. This becomes the emotional target. Design succeeds on emotional response, not on consistency.
2. Taste and references. "What should this draw on?" Options: "I'll type two or three things I love and one or two I find tacky"; "I have inspiration images or sites (I'll list them)"; "The current page's identity, improved"; "Derive taste from the product and audience". Anything with images, sites or the current page means a reference brief gets written (Step 2, `references/reference-brief.md`); the tacky list tells you which version of a theme to avoid.
3. Risk dial. "How far from convention?" Distinctive but safe (1 to 2); bold with a clear concept (3, the usual recommendation); break the rules but make it look good (4 to 5). Calibrates how many "terrible" ideas to include and how much structure to keep.
4. Constraints and target, multi-select: keep the existing brand (logo, colors, type found in the repo); mobile first; desktop first; must port into the current codebase. Nothing selected means greenfield. Detect the stack from the repo (package.json, framework files) rather than asking.

If the user says "surprise me", proceed with a seeded direction at risk 3 and the emotional target implied by the product. If they name sites, screenshot them into `design/references/` with `--no-full`; if they attach images, copy them there.

## Step 2: Explore directions (Discover)

1. If there are references or an existing page to keep, write the reference brief now (`references/reference-brief.md`): collect the code palette if the product defines colors in code, ask about kept elements if the current page is in the set, then invoke `design-brief-writer` once and save the result to `design/briefs/<slug>.md` with its hash. Every direction is built toward the brief's translation, and every critic reads the brief instead of the images.
2. Run `node "${CLAUDE_SKILL_DIR}/scripts/seed.mjs" --rolls --neighbors 2`. It prints the seed and a row of "dice rolls" (era, material, color, type, layout, motion, imagery, density, wildcard) plus two neighbors that change one or two axes. Read `references/directions.md` now for how to turn rolls into a coherent world; it also holds the catalog and the brief template.
3. Brainstorm twelve to sixteen directions, one line each, going broad rather than deep: four to six grown from the taste anchors or the brief, the seeded direction and its two neighbors, two or three that sound like they won't work (if an idea sounds like it can't work, you are probably in new territory), one or two collisions of two others. Give each a name and a sentence. Vary layout logic, material, era and motion, not just palette.
4. Show the full list in the reply, then use AskUserQuestion to let the user shortlist (multi-select, your recommended four as options, "Other" for the rest). Invite reactions like "I like X but it sounds tacky, more texture, some color". Sharpen the chosen ones to their taste; the sharpening is where their point of view enters.
5. People cannot react to a paragraph the way they react to a picture. When the shortlist has more than one direction, or the risk dial is 4 or 5 (then one of them should be a "terrible" idea), build quick proof-of-concept renders of up to two (three in `explore` mode), screenshot them, run one scored critic round each, and show the user the shots with their medians. The score informs; the user chooses. Record the losers with their scores; they are evidence, not waste.
6. Write a Direction Brief (template in `references/directions.md`) for the winner: concept sentence, emotional target, palette with hex values, type system, layout logic, motion motif, imagery and texture, the tacky version to avoid, and three signature moves that must be visible in the first screenshot. Then write the concise build prompt.
7. Record everything in `design/DESIGN-RECORD.md`: seed and rolls, the list, the choices with the user's words, the brief, and the directions not taken with a one-line reason. Write the build prompt of any unbuilt "terrible" idea into the rejected-prompts table so it can be tried on a future model.

Parallel proof-of-concept builds can go to `general-purpose` subagents, two at a time at most, each given only its brief, the build rules below and the output path; they do not need the conversation.

## Step 3: Build the prototype (Discover into Define)

Build as standalone HTML: `design/explorations/<slug>/index.html`, self-contained (inline CSS and JS, fonts from Google Fonts or a system stack), semantic markup, CSS custom properties for every token, real copy, both mobile and desktop designed rather than one squashed into the other. Generated media lives in `design/assets/` and is referenced from the HTML as `../../assets/<file>` so `file://` screenshots resolve it. Standalone HTML makes screenshots and iteration fast and cheap; the port into the real stack comes after the design is settled.

Build ambitiously. Commit fully to the concept: a half-committed theme reads as a template wearing a costume. Keep components consistent so the concept feels like a system, not decoration. Use texture, material and imagery over flat gradients. Use native controls unless the concept itself is about custom controls. Give motion one motif and a purpose. Make the three signature moves obvious in the first screen.

Then screenshot and look:

```
node "${CLAUDE_SKILL_DIR}/scripts/screenshot.mjs" design/explorations/<slug>/index.html --out design/shots/<slug> --name r0 --viewports desktop,mobile --scroll 3
```

Read the PNGs. Fix breakage first: overflow, overlapping text, missing fonts, images that did not load, console errors the script reports. Critic time is expensive; spend it on design, not bugs.

## Step 4: The critic loop (Define)

Read `references/critic-loop.md` before the first round; it holds the delegation template, the stopping rules and how to pick fixes. The short version:

1. Screenshot the current state with a new round name (`r1`, `r2`, ...) and `--critic-copy`. The script prints `criticFiles`: copies with neutral names in a random folder.
2. Invoke three fresh `design-critic` subagents with the Agent tool, in parallel, in the foreground, with identical messages. Pass only: the `criticFiles` paths (absolute, as printed), the one-sentence aesthetic statement, the emotional target, the audience, the kind of surface, and the reference brief text if one exists. Nothing else.
3. Take the median score and log the spread; take the gaps from the median critique; keep the rules tally (if there is a brief) as its own column. Apply the top three to five gaps in full, plus every generated-looking pattern and accessibility flag. Structure before polish. If the top gap is about composition or structure, a polish round will not move the score: change the layout, or go back to the Direction Brief. If the critics say the page is shapes standing in for imagery, do the media step (Step 5) as the fix for that round.
4. Re-screenshot, look, and go again.

Stop when the median reaches the target (9 by default), or after six rounds, or when the median has not gained a full point in two rounds. A plateau means the direction or the structure is the problem; tell the user and offer a rethink instead of grinding. In `iterate` mode on an existing design, stop when the median is at least a point above the surface's baseline or after two rounds without a full point, and report.

Record every round (median, spread, rules passed, top gaps, what changed) in the design record.

## Step 5: Media (Define)

When the page reads as gradients and shapes standing in for imagery, or the direction calls for illustration, photography, 3D or motion, generate the real thing. Read `references/media.md` for prompt craft, integration techniques, the video workflows, and the fallbacks when no key exists (SVG illustration, real texture, typographic imagery; never glows and blobs).

- Images: `node "${CLAUDE_SKILL_DIR}/scripts/gemini-image.mjs" --prompt "..." --out design/assets/<name>.png --aspect 16:9` (add `--quality` for hero art, `--ref` for consistency across a set). Combine images with CSS effects, masks, shaders or 3D so they belong to the page instead of sitting on it.
- Video: run `node "${CLAUDE_SKILL_DIR}/scripts/fal-video.mjs" check` first. With a key, use `loop` for transparent looping clips and `i2v` with `--end-image` for keyframe transitions. Without a key, write "video skipped: no FAL_KEY" in the record once and move on.
- Verify frame by frame in the browser: screenshot at several scroll positions (`--scroll 4`) and at both viewports after adding media. Media that looks right in isolation often breaks the page.

## Step 6: Deliver (subtract, remove the tells, design the states, pass the checks)

1. Subtraction and tells: read `references/ai-tells.md` and do the pass yourself; this is judgment work, not critic work. Walk every element and ask what really needs to be there. Remove glows, gradients, decorative containers, redundant labels, explanations of the obvious, custom components that are worse than native ones, colors that compete, empty space that only exists as spacing. Putting less on the screen communicates more. Then run the tells checklist by category and the usability sanity checks. Fixing a tell means removing or replacing it, not decorating around it: a purple gradient with a noise overlay is still a purple gradient.
2. States: for app surfaces, empty, loading, error, partial and "nothing to do here" are screens people see, sometimes more than the happy path. Design and screenshot each in the same direction (details in `references/ai-tells.md`, section 6). On a full run every state gets built; in `iterate` mode, only the states the task touched, and name the rest as unstyled rather than reporting the surface complete.
3. Lighthouse: `node "${CLAUDE_SKILL_DIR}/scripts/lighthouse.mjs" design/explorations/<slug>/index.html --out design/audits/<slug>` (add `--mobile` for mobile-first surfaces, and run against the dev server URL for a ported app). Accessibility is a gate at 90: fix every failing accessibility audit in the design's own vocabulary (an accent that fails contrast gets a darker step of the same hue, not gray), re-run once, and stop; a `sonnet` subagent may do this mechanical work. Performance, best practices and SEO are reported, not gated; performance below 80 after adding media means the media is too heavy. Log the scores in the record. Skip with one line for non-web surfaces or when `npx` cannot fetch Lighthouse.
4. The gate: one more scored round on the finished design, three critics, median at or above the target and spread of two points or less. If it fails, apply the shared gaps and run it once more; then report to the user either way. Record the gate scores.
5. Show the user the screenshots of every touched surface and get their judgment before opening any PR; done is when they have seen it, not when tests pass.

## Step 7: Port and hand off

If the design must live in a codebase, port it now: move tokens into the stack's theming layer, rebuild components in the framework, keep the signature moves intact, then screenshot the running app (dev server URL), run Lighthouse and a final scored round on the real thing, since ports lose details. Write handoff notes in the record: tokens, type scale, signature moves, motion rules, and what must never be "cleaned up" by a future refactor. End with a spot check row so the surface has a reference screenshot for the future.

Close with a short summary for the user: what makes this design distinctive, what was removed, the final scores, and how to keep it there (`/designer spot` after UI changes, `/designer iterate` when it slips).

## Modes

- `explore <idea>`: Steps 0 to 3 with three proof-of-concept directions scored and shown, then stop for the user to choose.
- `iterate`, `critique`, `review`: Step 0, baseline round if the record has none, then the critic loop on the existing direction with the `iterate` stopping rule (critic-loop.md, section 7).
- `spot`, `check`: the cheap tier. Read `references/spot-check.md`: one screenshot, one `design-spot-check` call (pairwise against the last shot, rules tally, two nudges, no score), one row in the record, escalate to `iterate` when it says clearly worse. Run it after any task that changed a screen.
- `brief`: write or refresh the reference brief from the user's images, the current page, or both (`references/reference-brief.md`). A new brief starts a new baseline.
- `media`, `images`: Step 5 on the current design.
- `tells`, `polish`: Step 6 on the current design, including the gate.
- `port`: Step 7 from the winning exploration into the codebase.

## Cost and time

A full run is typically an hour or two of agent time: cheap where it can be (implementation on the session model, standalone HTML, one screenshot set per round) and expensive only where it pays (three critics on the strongest model per scored round, one brief on the strongest model). `iterate` is a fraction of that; `spot` is one short call. Tell the user before starting anything costly: parallel builds, video generation, or more than six critic rounds.
