# world-class-designer

Turn Claude Code into a world-class designer.

A Claude Code skill plus three companion subagents that take a website or app design idea and push it to a distinctive, studio-quality result instead of the generic "AI look". It implements the process from Anshu Chimala's ["How to turn your AI into a world-class designer"](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world) (Lenny's Newsletter), which gave this project its name: seed strings for variety, ambitious and specific prompts, screenshot-only design critics in fresh contexts, image and video generation, then ruthless subtraction and removal of AI tells. The critic protocol (three critics per round with a median score, a cached reference brief instead of inspiration images, a rules tally kept apart from the score, a cheap pairwise spot check) follows measurements published by the [design-director](https://github.com/j-withmission/design-director) project. See [NOTICE.md](NOTICE.md) for credits.

```
/designer landing page for my productivity app
```

## How it works

1. **Interview.** Four questions: what the visitor should feel in the first three seconds; what to draw on (things you love and find tacky, inspiration images or sites, or the current page); how far from convention to go; constraints. Taste has to come from you; the model's defaults are the problem being solved.
2. **Explore.** A random seed from OS entropy is turned into "dice rolls" (era, material, color, type, layout, motion, imagery, density, wildcard) so the model cannot drift back to its favorites. Twelve to sixteen directions are brainstormed, including ideas that sound like they won't work; you shortlist; the shortlist is rendered as quick proof-of-concept pages, scored, and shown to you as pictures before you choose.
3. **Build.** Standalone HTML prototypes in `design/explorations/`, both desktop and mobile designed on purpose, real copy, tokens as CSS custom properties.
4. **Critic loop.** Each round: screenshots, then three fresh `design-critic` subagents on the strongest model that see only the screenshots (never code, diffs, round numbers, previous scores, or inspiration images). Median score, spread logged, gaps applied structure-first, stopping rules fixed in advance.
5. **Media.** When the page is gradients and shapes standing in for imagery: Gemini images (with a consistency workflow for sets) and, with a fal.ai key, seamless looping clips with the background removed and keyframe transitions scrubbed by scroll. Skipped cleanly without keys.
6. **Deliver.** Subtraction pass, AI-tell checklist, the states pass (empty, loading, error, partial, nothing to do), a Lighthouse accessibility gate at 90, and a final three-critic gate.
7. **Port.** Into your stack, then a final round on the running app, and a record with everything a future session needs, including rejected directions with the model and date so they can be retried on a newer model.

## What is in the box

```
.claude-plugin/plugin.json      plugin manifest; the repo is also its own marketplace
skills/designer/
  SKILL.md                      the process: interview, explore, build, critic loop, media, deliver, port, modes
  references/directions.md      seed-to-direction method, catalog of bold directions, brief template
  references/reference-brief.md the cached brief written from inspiration images, the current page and code colors
  references/critic-loop.md     delegation template, three-critic median, stopping rules, gate, baselines
  references/spot-check.md      the cheap pairwise check after any UI change
  references/ai-tells.md        subtraction pass, tells by category with fixes, usability checks, states pass
  references/media.md           image prompt craft, integration, fal.ai video workflows, fallbacks without keys
  references/design-record.md   the running log the skill keeps in design/DESIGN-RECORD.md
  scripts/check-env.mjs         which keys and tools are available (never prints key values)
  scripts/seed.mjs              random string from OS entropy plus the derived direction rolls
  scripts/screenshot.mjs        desktop/mobile screenshots (Playwright, or headless Chrome/Edge), neutral critic copies
  scripts/gemini-image.mjs      text-to-image and image editing with the Gemini API
  scripts/fal-video.mjs         image-to-video, seamless loops, background removal via fal.ai
  scripts/lighthouse.mjs        Lighthouse audit with an accessibility gate (serves local files itself)
agents/design-critic.md         screenshot-only scoring critic (Fable)
agents/design-brief-writer.md   writes the reference brief once per surface (Fable)
agents/design-spot-check.md     pairwise spot check, no score (Sonnet)
install.sh / install.ps1        manual install into ~/.claude (or a project's .claude)
.env.agents.example             where API keys can live
```

Skill and agents, not one or the other: the skill runs inline in your session so it can interview you, read your repo and orchestrate; the critics have to run in isolated contexts with only screenshots, which is exactly what subagents are. Subagents cannot ask you questions, so the whole thing could not be a single agent.

## Requirements

- Claude Code (recent version; the agent files use `omitClaudeMd` and `effort`, which older versions ignore harmlessly). The scoring critic and brief writer use the `fable` model alias; change it to `opus` in the agent files if your account has no Fable access.
- Node 18 or newer (the scripts have no dependencies).
- For screenshots: Chrome, Edge, Chromium or Brave installed, or Playwright in the project (`npm i -D playwright && npx playwright install chromium`). Playwright gives true full-page and scroll-position captures; the browser fallback gives top-of-page and tall-window captures. Works on Windows (Git Bash or PowerShell), macOS and Linux.
- For the Lighthouse pass: `npx` with network access (it fetches Lighthouse on first use) and a Chromium browser. Skipped with one line when unavailable.
- Optional: `GEMINI_API_KEY` for images, `FAL_KEY` for video (video is skipped automatically without it), ffmpeg for converting clips.

## Install

As a plugin (recommended; installs the skill and the three agents together and updates with the repo):

```
/plugin marketplace add <your-github-user>/world-class-designer
/plugin install world-class-designer@world-class-designer
```

The skill is then `/designer` (or `/world-class-designer:designer` when another skill has the same name), and the agents appear as `world-class-designer:design-critic` and so on.

Manually, into `~/.claude` for every project (Git Bash, macOS, Linux):

```bash
./install.sh            # personal: ~/.claude
./install.sh --project  # project: ./.claude in the current repo, commit to share
```

Windows PowerShell (if scripts are blocked, run `powershell -ExecutionPolicy Bypass -File .\install.ps1`):

```powershell
.\install.ps1
.\install.ps1 -Project
```

Or copy `skills/designer/` to `~/.claude/skills/designer/` and the three files in `agents/` to `~/.claude/agents/`. Then run `node ~/.claude/skills/designer/scripts/check-env.mjs` to see what is available.

If you also use design-director, keep only one of them able to auto-trigger (their descriptions overlap on "less generic" and "critique this"): add `"skillOverrides": {"design-director": "user-invocable-only"}` (or the reverse) to your settings.

## Use

In Claude Code, inside the project the design belongs to:

```
/designer landing page for my productivity app      # full run
/designer explore onboarding for a calorie tracker   # three scored directions, then stop for you to choose
/designer iterate                                     # baseline, then critic rounds on the current design until +1 or plateau
/designer spot                                        # cheap pairwise check after a UI change; no score
/designer brief                                       # write or refresh the reference brief from your inspiration
/designer media                                       # generate and integrate imagery (and video with FAL_KEY)
/designer tells                                       # subtraction, AI-tell removal, states, Lighthouse, gate
/designer port                                        # move the winning prototype into the codebase
```

Claude also invokes the skill on its own when you ask for a landing page, a redesign, a UI that should not look generic, or a critique. It states the cost of a run before starting it, so you can pick a lighter tier.

What it produces: `design/explorations/<direction>/index.html` prototypes, `design/shots/` screenshots per round, `design/briefs/` the reference brief, `design/assets/` generated media, `design/audits/` Lighthouse reports, and `design/DESIGN-RECORD.md` with the brief, every critic median and spread, the baseline per surface, every media prompt, the spot log, and the ideas that were rejected.

To make the spot check automatic, add one line to the project's `CLAUDE.md`: "After any change to a user-facing screen, run /designer spot before reporting done."

## API keys

### Gemini (image generation)

1. Create a key in Google AI Studio (aistudio.google.com, "Get API key"). Keys belong to a Google Cloud project; set a budget alert on that project.
2. Make it available to Claude Code in one of three ways:

   a. Claude Code settings, applies to every session (simplest):
      `~/.claude/settings.json`
      ```json
      {
        "env": {
          "GEMINI_API_KEY": "AIza...",
          "FAL_KEY": "..."
        }
      }
      ```
   b. A gitignored file the scripts read automatically: `.env.agents` in the project (add it to `.gitignore`; `check-env` warns if you forget) or `~/.claude/.env.agents` for all projects. See `.env.agents.example`.
   c. A normal environment variable. Windows PowerShell: `setx GEMINI_API_KEY "AIza..."` then restart the terminal. Git Bash: `echo 'export GEMINI_API_KEY="AIza..."' >> ~/.bashrc`. macOS: the same line in `~/.zshrc`.

3. Check with `node ~/.claude/skills/designer/scripts/check-env.mjs`, then try:
   `node ~/.claude/skills/designer/scripts/gemini-image.mjs --prompt "a matte ceramic teapot on a solid #F3EDE2 background, soft north light, no text" --out design/assets/test.png --aspect 16:9`

If a model ID is rejected, run the script with `--list-models`; the defaults are `gemini-3.1-flash-image` (everyday) and `gemini-3-pro-image` (`--quality`), and the script falls back to the current flash image model automatically when the default is gone. Override with `GEMINI_IMAGE_MODEL` / `GEMINI_IMAGE_QUALITY_MODEL`.

If you use `.env.agents` in a project, tell Claude where it is by adding to the project's `CLAUDE.md`:

```
Image and video generation: use the world-class-designer scripts (gemini-image.mjs, fal-video.mjs).
API keys live in .env.agents (gitignored); the scripts load it automatically.
```

Only Gemini is wired up for images. If you would rather use an OpenAI image model, adapt `gemini-image.mjs` (same shape: prompt in, PNG out) and point the skill at it; pull requests welcome.

### fal.ai (video, optional)

Create a key at fal.ai (Dashboard, Keys), set a spend limit, and provide it as `FAL_KEY` the same way. Defaults: `bytedance/seedance-2.5/image-to-video` for clips and `veed/video-background-removal` for transparent loops (objects by default, `--person` for people); override with `FAL_I2V_MODEL` / `FAL_MATTING_MODEL` or `--model`. Without `FAL_KEY` the skill notes "video skipped" and continues.

## Privacy and safety notes

- The scripts send data only to the services you give keys for. Images passed to `gemini-image.mjs` go to Google's API; images and clips passed to `fal-video.mjs` are uploaded to fal's CDN, where they sit at unguessable but public URLs. Do not feed either script confidential material.
- `check-env.mjs` reports whether a key is present and never prints its value.
- The skill pre-approves `Bash(node *)` for the turn it is invoked in so screenshots and media calls do not prompt. Remove the `allowed-tools` line in `SKILL.md` if you would rather approve each call, or add `"Bash(node *)"` to `permissions.allow` in your settings to approve it for whole sessions.
- Lighthouse runs through `npx --yes lighthouse`, which downloads Lighthouse from npm on first use.

## Configuration

- Critic and brief-writer model: `model: fable` in the agent files. If the first call fails with a model error, change it to `opus`. Never put the scoring critic on `sonnet`; its absolute scores are unstable. The spot check is on `sonnet` on purpose: it only compares pairs.
- Critic isolation: the critics have only the Read tool, no CLAUDE.md, and receive neutral copies of the screenshots (`design/shots/<slug>/.critic/<random>/desktop-top.png`) so nothing in a file name or a folder tells them how many rounds have passed. They receive the reference brief as text, never the inspiration images.
- Target score and round limits: defaults are 9/10 median, six rounds, stop on two rounds without a full point; say "target 8" or "up to 10 rounds" in your prompt to change them. Scores are comparable only within one configuration (critic model, critic prompt, brief); changing one starts a new baseline.
- Accessibility gate: 90 by default (`--min-a11y` on `lighthouse.mjs`).
- Screenshots: set `CHROME_PATH` if your browser is somewhere unusual; `--engine cli` forces the headless-binary path.
- Resource budget: at most two implementer subagents at a time; critics run three in parallel. Each screenshot run opens and closes its own browser.

## Cost

Implementation runs on your session model; each scored round costs three critic calls on the strongest model, the brief costs one, and the gate costs one more round. Images cost cents; video clips cost real money per second, so the skill tells you before generating more than a couple. Building proof-of-concept renders of more than one direction multiplies the build cost, so it is capped at two (three in `explore` mode) and only happens when you shortlist more than one or set the risk dial to 4 or 5. `iterate` is a fraction of a full run; `spot` is one short Sonnet call.

## Contributing

Issues and pull requests are welcome. Good first contributions: an OpenAI image script with the same interface, more directions in the catalog, and reports of critic score spreads on real projects (they are what the stopping rules depend on).

## License

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
