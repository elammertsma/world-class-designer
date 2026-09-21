# Directions: seeds, catalog, sharpening, brief

Contents: 1. Reading a seed as dice rolls · 2. Direction catalog · 3. Ideas that sound like they won't work · 4. Brainstorm and sharpening prompts · 5. Keeping a theme from turning tacky · 6. Direction Brief template

`<scripts>` below means the skill's scripts directory (`${CLAUDE_SKILL_DIR}/scripts`, the absolute path shown in SKILL.md).

## 1. Reading a seed as dice rolls

`node <scripts>/seed.mjs --rolls --neighbors 2` prints a long random string from the operating system's entropy source and the "dice rolls" derived from it: one value per axis in the table below, computed by the script (sum of the character codes of each four-character group, modulo the number of options), plus two neighbors that keep the row and change one or two axes. The model's own "random" choices are not random; they are its most probable choices, which is exactly the sameness we are escaping, and the same goes for doing the arithmetic in your head. Let the rolls pick an axis value even when the pick feels wrong. The friction is the point: it drops you somewhere you would not have chosen, and your job is to make that place look great.

The axes and their options (the script prints the chosen value for each):

| Axis | Options (index 0..n-1) |
|---|---|
| Era or culture (8) | 0 ancient/classical · 1 medieval/manuscript · 2 industrial 1900s · 3 mid-century modern · 4 1970s–80s analog · 5 1990s–Y2K digital · 6 present-day craft · 7 speculative future |
| Material (10) | 0 paper/print · 1 metal/machined · 2 glass/liquid · 3 stone/concrete · 4 wood/joinery · 5 textile/thread · 6 pixels/CRT · 7 ink/wet media · 8 ceramic/glaze · 9 light/neon |
| Color temperature (5) | 0 monochrome plus one accent · 1 warm earth · 2 cool mineral · 3 saturated and clashing · 4 pastel and chalky |
| Type voice (7) | 0 grotesk · 1 serif editorial · 2 monospace/technical · 3 display and extreme scale · 4 humanist sans · 5 handwritten/stencil · 6 blackletter or unusual revival |
| Layout logic (8) | 0 strict modular grid · 1 editorial columns with breaks · 2 radical asymmetry · 3 single fixed viewport, no scroll · 4 stacked full-bleed panels · 5 radial or centered object · 6 table/ledger/document · 7 map or spatial canvas |
| Motion character (6) | 0 none, everything static · 1 mechanical and stepped · 2 organic and slow · 3 glitchy and abrupt · 4 cinematic camera moves · 5 physics, things fall and settle |
| Imagery mode (7) | 0 photography · 1 illustration · 2 3D render · 3 generative/abstract · 4 typography only · 5 diagrams and instruments · 6 collage |
| Density (4) | 0 sparse, one thing per screen · 1 airy editorial · 2 dense and busy · 3 maximal, deliberately overwhelming |
| Wildcard constraint (10) | 0 only one typeface · 1 no rectangles · 2 everything is a list · 3 the page is one object · 4 cursor changes the world · 5 sound has a role · 6 one color only · 7 no images, only type and rules · 8 landscape only · 9 the layout breaks at a specific scroll point |

Interpret the row as a coherent world, not a checklist: "1970s-80s analog, textile, warm earth, monospace, ledger layout, stepped motion, diagrams, dense, everything is a list" is a knitting-pattern instruction sheet turned into an app. Name it. If two rolls truly contradict each other, keep the stranger one and bend the other. The neighbors are the same world seen from a slightly different angle; they give you two more list entries that are related but not the same. Record the seed and the rolls in the design record; never put the string itself anywhere in the design.

## 2. Direction catalog

Use this for range, not as a menu to copy from. The best direction for a product usually comes from colliding one of these with the user's taste anchors. Each entry: name, the idea, and the trap to avoid.

Physical and tactile
- Industrial control panel: switches, indicator lamps, engraved labels, satisfying clicks. Trap: cartoony skeuomorphism and gray gradients; use texture, consistent components, a little color.
- Swiss watch movement: precision engraving, brushed metal, tiny type, exact alignment. Trap: chrome everything; keep it matte with one polished detail.
- Letterpress shop: impressed type, paper tooth, ink spread, ornaments used sparingly. Trap: "vintage" filters; get the type right instead.
- Field notebook: ruled paper, pencil annotations, stamps, tabs. Trap: fake handwriting fonts everywhere; one handwritten element is enough.
- Blueprint and drafting table: cyan or white lines, dimension marks, section labels. Trap: making every element a diagram; content still needs hierarchy.
- Airline safety card: flat figures, numbered steps, high-contrast pictograms. Trap: clip art; draw one consistent figure style.
- Brutalist concrete: heavy blocks, raw edges, exposed structure, huge type. Trap: ugly on purpose; brutalism is still composed.
- Japanese joinery: interlocking blocks, wood tones, no fasteners visible, negative space. Trap: bamboo clichés.
- Laboratory glassware: clear vessels, measured marks, liquids as color. Trap: bubbles and glow.
- Vintage hi-fi: VU meters, knobs, walnut and aluminum, dials that move. Trap: every control a knob; use it for the hero moment only.

Worlds and places
- Isometric living city: features are neighborhoods, the page is a map you travel through. Trap: generic isometric icon packs; render your own scene.
- Museum exhibition: wall labels, vitrines, dim gallery lighting, one object per room. Trap: too much text on the wall labels.
- Night train: compartments, timetable typography, window views passing by. Trap: literal train illustrations; use the rhythm and signage.
- Space station manual: checklists, warnings, monospace, panel gaps. Trap: sci-fi neon.
- Botanical garden: pressed specimens, Latin labels, greenhouse light. Trap: stock florals.
- Deep sea: pressure, darkness, bioluminescence as the only light source. Trap: glow overload; light one thing.
- Alpine hut: wool, wood, cold light, maps with contour lines. Trap: postcard photography.
- Arcade cabinet: attract mode, scores, marquee art, CRT curvature. Trap: pixel fonts for body text.
- Board game box: components, rulebook typography, punch-out tokens. Trap: cheerful cartoon style when the product is serious.
- Weather station: readouts, barometric charts, timestamps, calm data. Trap: dashboards for their own sake.

Media eras
- Pixel-art video game stills: every section a frame from a game, parallax layers, sprites. Trap: mixing pixel densities.
- 1970s NASA graphics standards: worm-style logotype spirit, red-orange and gray, geometric precision. Trap: pastiche of a real identity; borrow the discipline, not the marks.
- 1990s rave flyer: acid colors, warped type, halftone, chaos with a grid underneath. Trap: unreadable copy.
- Medieval manuscript: rubrication, marginalia, drop caps, gold leaf as accent. Trap: blackletter body text.
- Risograph zine: two spot colors misregistered, grain, paper white. Trap: applying grain as a filter on top of a normal layout.
- Teletext and videotex: block graphics, a fixed grid, six colors on black. Trap: keeping it a gimmick; commit to the grid.
- Early Macintosh: one-bit graphics, dithering, bevels, system font spirit. Trap: fake window chrome on every element.
- Y2K chrome: liquid metal, lens flares, translucent plastic, curved type. Trap: gradients doing all the work; model real forms.
- Bauhaus poster: primary colors, circles and bars, diagonal type, asymmetry. Trap: Bauhaus as a color palette only.
- Editorial magazine spread: big headline, pull quotes, columns, folios, a photo that bleeds. Trap: web pages are not fixed spreads; design the scroll.
- Film title sequence: type entering and leaving, a camera that moves, credits rhythm. Trap: motion that blocks reading.
- Comic panels: gutters, panel shapes, speech as UI, sound effects as headings. Trap: cheap halftone dots everywhere.

Data and systems
- Terminal/TUI: box-drawing characters, monospace grid, keyboard hints. Trap: green-on-black hacker aesthetic.
- Flight deck: primary flight display logic, tapes and scales, crisp alerts. Trap: too many instruments; one central display.
- Cartography: contour lines, legends, scale bars, place labels. Trap: a map with nothing on it.
- Stock ticker and ledger: tables as the hero, tabular figures, rules and totals. Trap: tables that are not actually aligned.
- Seismograph and instruments: traces, pen plots, calibration marks. Trap: fake data; plot something real about the product.
- Constellation chart: points, faint lines, labels in small caps, deep blue-black. Trap: starfield background clichés.

Motion and material first
- Liquid glass: refraction, caustics, real physics, one glass object. Trap: glassmorphism cards everywhere.
- Paper cutout diorama: layered paper, drop shadows from real depth, parallax. Trap: shadows that contradict each other.
- Claymation: soft forms, fingerprints, stop-motion motion. Trap: smooth 3D that reads as toy plastic.
- Knitted and textile: stitches as pixels, woven grids, fabric physics. Trap: a knit texture on a normal page.
- Chalkboard and marker: hand-drawn diagrams that are actually good drawings. Trap: hand-drawn fonts.
- Neon signage: one glowing element in a dark, matte world. Trap: everything glows.
- Holographic foil: iridescence that shifts with the cursor or scroll. Trap: rainbow gradients that do not respond to anything.
- Wet ink: bleeding edges, absorbed color, brush marks. Trap: brush strokes as decoration.
- Ceramic glaze: subtle color variation, crazing, matte surfaces, chunky forms. Trap: beige everything.

Rule-breaking
- Radically asymmetric: dissonant colors and type, uncomfortable negative space, still resolved. Trap: random placement; asymmetry needs a logic.
- Single viewport, no scrolling: every state lives in one screen, navigation is spatial. Trap: cramming; cut content instead.
- Everything is a table: the whole product expressed as one large, beautiful table. Trap: forgetting mobile.
- Text only, one typeface, one color: rhythm, scale and spacing do all the work. Trap: it becomes a document; design the scale.
- Monochrome plus one violent accent: the accent appears exactly where the action is. Trap: the accent creeping into decoration.
- Landscape only: horizontal scroll, panoramic composition. Trap: hijacking the wheel badly; use native horizontal scroll or scroll-linked transforms with a visible affordance.
- Cursor-driven reveal: the page is dark or hidden until the cursor or touch reveals it. Trap: unusable on mobile; design the touch version first.
- Sound first: interface sounds with real design, visuals that answer them. Trap: autoplay; sound only on interaction, with a visible toggle.

## 3. Ideas that sound like they won't work

Include two or three of these (or your own) in every brainstorm. If it sounds like it cannot work, you are probably in new territory. Build one whenever the user picks it or the risk dial is at 4 or 5; otherwise write its build prompt into the record's "rejected prompts" table so it is not lost. When a built one fails, record the prompt with the model and date; a future model may pull it off.

- The landing page is a receipt, printed line by line as you scroll.
- The product page is a crossword; the clues are the features.
- The SaaS page is a weather report for your workday.
- The whole product is an animated table of contents.
- The UI is a vending machine; you pick features with buttons and they drop.
- A landing page as a single continuous sentence, typeset across the whole scroll.
- The site is an unboxing; every scroll removes one layer of packaging.
- The dashboard is a train departures board with split-flap letters.
- The page is a single photograph; every feature is a hotspot in the scene.
- Onboarding as a board game path with real dice rolled per visitor (fresh randomness each time, never the design's own seed).
- The pricing page is a tailor's measurement form.
- The docs are a subway map; lines are workflows, stations are pages.

## 4. Brainstorm and sharpening prompts

Brainstorm, for yourself or a subagent: "I want a bold, unique design language for <product> for <audience>, aiming at <emotional target>. List as many directions as you can with a name and one line each. Go broad, not deep. Include a few that sound like they won't work. Vary layout logic, material, era and motion, not just palette."

Sharpening, mirroring how the user talks: "<Direction name>: I'm imagining something <tactile / quiet / loud>. I first pictured <the obvious version> but that feels tacky; avoid it. Instead <consistent components, little touches, more texture, some color while keeping the feel>. Sharpen this direction to that taste, then write a concise prompt an agent could use to build a first proof-of-concept page."

The user's reactions to the list are the most valuable taste data you will get. Quote their words in the brief.

## 5. Keeping a theme from turning tacky

- Commit fully or not at all. A normal layout with themed decoration is a costume; the theme has to change the layout logic, the type and the interaction, not just the colors.
- One motif, repeated with discipline, beats ten references to the theme. Put the theme in the details (labels, rules, corners, sounds, the way things move) as much as in the hero.
- Texture over gradient; material over effect; one light source.
- Native controls unless the theme is about controls. A themed select box that works worse than the browser's is a tell.
- Restraint reads as expensive. The cheapest-looking version of any theme is the one that does everything the theme suggests.
- Typography carries most of the identity. Pick a type system that belongs to the world (a real revival, a real mono, a real display face), and set it with care: scale, measure, leading, tracking, tabular figures where numbers align.
- Copy is part of the design. Write it in the direction's voice, short and specific. No "seamless", "effortless", "unlock", "elevate", "supercharge".

## 6. Direction Brief template

```
# Direction: <name>
Concept: <one sentence a stranger would understand>
Emotional target: <what the first three seconds should feel like>
Taste anchors honored: <the user's loves this draws on> | Avoids: <their tacky list, the trap for this theme>
Risk level: <1-5>

Palette: <background, ink, one accent, one texture or material; hex values>
Type: <display face / text face / mono or numerals; scale and tone>
Layout logic: <the rule that decides where things go>
Motion motif: <one kind of movement and when it happens; reduced-motion fallback>
Imagery and texture: <what is generated or drawn, what style, what is never used>
Sound: <none, or when and what>
Signature moves (visible in the first screenshot):
1. <move>
2. <move>
3. <move>
Never: <three things that would break the illusion>

Build prompt (for the implementer):
"<concise, ambitious, specific prompt that names the concept, the palette, the type, the layout logic, the three signature moves, the trap to avoid, and 'make it look great'>"
```
