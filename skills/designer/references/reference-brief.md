# The reference brief

Contents: 1. Why a brief instead of images · 2. When to write one · 3. Inspiration sources · 4. Colors from code · 5. Kept elements · 6. Procedure · 7. Using the brief

`<scripts>` below means the skill's scripts directory (`${CLAUDE_SKILL_DIR}/scripts`, the absolute path shown in SKILL.md).

## 1. Why a brief instead of images

Abstract criteria drift, and it turns out images drift too. Measured on a bench of real sites (design-director, 2026-09-11): a critic handed a photograph as a moodboard dismissed it in 31 of 33 critiques; critics asked to translate the photograph themselves read it differently from one another and produced critiques asking for opposite palettes; one brief written once by a stronger model was read the same way by every critic on every run, with rule verdicts agreeing 91% of the time and score spreads within a point. Rules written from a photograph alone were nearly unattainable by real pages; adding one product surface to the set made them attainable.

So: when there is inspiration, one strong model writes one brief, and the critics and spot checks read that text. They never see the images.

## 2. When to write one

- The user supplied inspiration images or named sites they admire (screenshot those with `<scripts>/screenshot.mjs <url> --out design/references --name <site> --no-full`).
- The run is on an existing page (`iterate`, a redesign): the current page's screenshot is a valid reference for the identity to keep.
- Both: the current page plus images that say where it should go.

Without inspiration the critic works from the aesthetic statement alone and there is no rules tally; that is fine for a greenfield exploration. Ask the user once, as part of the interview, which source to use; record "no brief" in the design record so the question is not asked again for that surface.

A brief is written once per surface and regenerated only when the inspiration set, the code palette or the kept elements change. Regenerating starts a new baseline: scores across briefs are not comparable. Never regenerate to get a better number.

## 3. Inspiration sources

- User images: copy them into `design/references/`. Any kind is valid (photograph, painting, poster, film still, product surface). Prefer at least one product surface alongside a photograph so the rules stay satisfiable.
- The current page: screenshot it at its usual viewport, look at it yourself first (a broken render makes a broken brief), and tell the brief writer which file is the current page so it reads it for identity, not defects. A brief read only from a page that already looks generic can write the generic defaults down as the direction; for a redesign, add outside images.

## 4. Colors from code

A model estimating hex values from a screenshot gets them wrong, and then every critic checks the page against the wrong colors. When the product defines colors in code, collect them before writing the brief:

- CSS custom properties in the stylesheet the app actually loads (`:root`, `.dark`, `[data-theme]`).
- Tailwind `@theme` blocks (v4) or `theme.colors` / `theme.extend.colors` in `tailwind.config.*` (v3).
- Token files (`tokens.json`, Style Dictionary or Figma exports), theme objects in CSS-in-JS, MUI, Chakra.
- Native: iOS `*.colorset`, Android `colors.xml`, Compose `ColorScheme`, Flutter `ThemeData`.

Collect about twenty semantic tokens at most (background, surface, text, muted text, rule, accent, state colors), resolve `var()` aliases, keep light and dark sets separate, and pass them as `name: value, role`. When the current page is in the set the code values are authoritative; with images only they are the palette to keep unless the images clearly call for a change.

## 5. Kept elements

A brief read from the current page will sometimes call a deliberate element a defect (a watermark, an accent used at rest, unusual numerals). When the owner confirms an element is part of the identity, pass it to the brief writer as a kept element so no rule fails it, and list it in the design record next to the brief line.

## 6. Procedure

1. Assemble the set: one to four images in `design/references/`, with one line each on what it is.
2. Collect the code palette (section 4) and the kept elements (section 5), if any.
3. Invoke a fresh `design-brief-writer` subagent with the Agent tool, in the foreground. Give it only: the image paths in order (marking which one is the current page, if any), the aesthetic statement, the code palette block, and the kept elements block.
4. Save the output verbatim to `design/briefs/<slug>.md` with a header line: date, model, source (images | current page | both), palette source (code, with the file | images), image file names, and a hash of the brief text (`shasum -a 256` or `sha256sum`, first 12 characters; on Windows Git Bash `sha256sum` exists). Put the path and hash in the design record.
5. If the brief's Resolution picked a governing reference the user did not intend, fix the set (add or drop an image) and regenerate. Do not hand-edit the brief.

## 7. Using the brief

- The Translation is what the implementer builds toward: the aesthetic statement made concrete.
- The Rules are the checklist the critic and the spot check tally. They are progress tracking, never a score; a page can fail every rule and be well made, and the score says so.
- Every critic and spot check for this surface gets the brief text verbatim in its message, under a "Reference brief" heading, and never the images.
- A rule that fails three rounds running is either the next gap to take or a rule the user should drop; ask which.
