# Subtraction and AI tells

Contents: 1. The subtraction pass · 2. Tells by category, with fixes · 3. Native beats custom · 4. Usability sanity checks · 5. Copy rewrite rules · 6. The states pass

## 1. The subtraction pass

Models add; they rarely take away. The clearest sign that a design was generated is that it overexplains everything and carries elements that serve no purpose. Restraint reads as premium because it signals that every choice was deliberate.

Walk the page from top to bottom and ask of each element: what would be lost if this were gone? If the answer is "nothing" or "it would look emptier", remove it and look at the screenshot again. Emptier is usually better. Specifically hunt for:

- Glows, gradients, blurs, halos and floating blobs that exist to fill space.
- Containers around things that did not need containing: cards around single paragraphs, boxes inside boxes, borders that duplicate spacing.
- Labels that repeat what the content already says ("Features" above a list of features, "Click to continue" on a button that says Continue).
- Explanations of the obvious: subtitles that restate headings, tooltips on self-evident icons, captions that describe the image.
- Custom components that work worse than the native ones they replaced.
- Empty space that is merely spacing rather than breathing room with a purpose.
- Colors and highlights competing for attention; more than one accent doing "look here".
- Sections that exist because landing pages usually have them (a testimonial row with nothing to say, a logo wall of nobody, a stats strip of made-up numbers).
- Icons next to every heading, checkmarks next to every bullet.
- Decorative dividers, section numbers, and ornaments not called for by the direction.

Do the pass before the final critic round; the critic should be judging what remains, not cataloguing clutter.

## 2. Tells by category, with fixes

Layout
- Hero with text left and a graphic right, centered on the viewport. Fix: let the direction's layout logic decide; try a single full-bleed image with the headline set into it, an editorial column split, or a typographic hero with no graphic.
- Three identical feature cards in a row, icon in a tinted circle above each. Fix: one strong feature per section with real imagery, or a dense table, or an annotated screenshot; vary rhythm between sections.
- Every section the same shape: eyebrow label, centered heading, one-line subtitle, grid. Fix: give each section its own composition; remove eyebrows entirely unless they carry information.
- Everything centered. Fix: pick an alignment logic and hold it; left-aligned type reads faster and looks more considered.
- Uniform padding everywhere, uniform card sizes, uniform radius. Fix: build a spacing scale with contrast (tight inside, generous between), and let one element be big.
- Section dividers, alternating background stripes, "wave" section edges. Fix: use spacing, type scale, and imagery to separate sections.
- Mobile as a squashed desktop (four columns stacked forever). Fix: design the mobile composition on its own: what leads, what collapses, what becomes a horizontal scroller, what disappears.

Color
- Purple, indigo, violet, or blue-to-purple gradients as the brand. Fix: choose a palette from the direction's material and era; commit to one accent.
- Gradient text. Fix: solid ink; use scale and weight for emphasis.
- Glassmorphism cards (frosted blur, thin white border) on a gradient. Fix: real surfaces with real edges, or no cards at all.
- Dark mode with neon accents, glowing borders, "cyber" grids. Fix: matte darks with one light source; accents at low saturation except where action lives.
- Too many accents; badges, pills and highlights in three colors. Fix: one accent, used only where the user acts.
- Pastel rainbow category colors. Fix: a restrained scale derived from the palette; differentiate with shape and label, not only hue.

Typography
- Inter, Roboto, Poppins, or the framework default for everything. Fix: a type system chosen for the direction: a real display face plus a real text face, or one exceptional family used across a large scale.
- Huge bold heading, gray subtitle, repeat. Fix: build a type scale with a reason (a modular ratio or an editorial hierarchy) and vary the roles: a small caps label, a long-measure paragraph, a giant numeral.
- Tracking set wide on everything, or negative tracking on body text. Fix: tight tracking only on large display sizes; body at default; small caps and labels spaced open.
- Long line lengths, centered paragraphs, orphaned words. Fix: 55 to 75 characters per line, left-aligned, balanced headline wraps (`text-wrap: balance`).
- Emoji as icons or bullets. Fix: real icons in one style, or no icons.
- Sparkle, rocket, lightning and "magic" iconography. Fix: remove; let copy and imagery carry the idea.

Copy
- "Seamless", "effortless", "unlock", "elevate", "supercharge", "empower", "next-generation", "all-in-one", "revolutionize". Fix: say the specific thing the product does, in the user's words.
- "It's not X, it's Y" constructions, tricolons ("faster, smarter, better"), "Whether you're a ... or a ...". Fix: one claim per sentence, concrete nouns.
- Exclamation marks, em dashes, rhetorical questions as headings. Fix: periods, commas, statements.
- Invented social proof: "Trusted by 10,000+ teams", "99.9% uptime", "4.9 stars", logos of companies who are not customers, testimonials from stock-photo people. Fix: real proof or none. An empty spot is honest; an invented one is a tell and a liability.
- Placeholder text and lorem ipsum. Fix: write the copy; it is part of the design.
- Every button "Get started". Fix: buttons that say what happens ("Open the demo", "Download for Mac", "Ask for a quote").

Components
- Pill badges above headings ("NEW", "AI-POWERED", with a sparkle). Fix: remove.
- Cards with hover-lift and scale transforms on everything. Fix: hover states that reveal information or change color, on interactive elements only.
- Custom checkboxes, selects, scrollbars, cursors and tooltips that work worse than native. Fix: native controls styled with `accent-color`, `color-scheme` and borders; custom only if the concept requires it and the custom version is better.
- Toggle switches for settings that are not on/off, tabs for two items, accordions hiding the important content. Fix: the simplest control that fits.
- Avatars in stacks, "online" dots, notification badges as decoration. Fix: remove unless real.
- Floating chat bubbles, cookie-style banners, sticky CTAs everywhere. Fix: one clear path to the action.

Imagery
- Abstract 3D blobs, glassy spheres, floating cubes, gradient meshes. Fix: imagery that depicts the product or the world of the direction, generated with a specific style prompt (see media.md) or rendered by the page itself.
- Isometric people-at-desks illustration packs, Corporate-Memphis figures. Fix: one consistent illustration style of your own, or photography, or none.
- Screenshots inside a browser or phone frame at a jaunty angle with a shadow. Fix: the real screenshot, cropped with intent, at true scale.
- Stock photography of diverse teams high-fiving. Fix: product imagery, objects, environments, or type.
- Images that do not match each other (different renderers, palettes, light). Fix: generate as a set with a shared style prompt and a reference image.

Motion
- Fade-up on scroll for every element, in sequence, forever. Fix: one motion motif tied to the direction, applied to a few moments; most content simply appears.
- Bouncy springs and overshoot on serious products; linear easing on playful ones. Fix: easing that matches the material.
- Animated gradient backgrounds, floating particles, parallax on everything. Fix: remove, or keep one and make it excellent.
- Motion that blocks reading, loaders that delay content, hover effects on touch devices. Fix: content first; motion as reward, not gate; respect `prefers-reduced-motion`.

Rhythm and structure
- Landing page as the canonical stack: hero, logos, three features, how it works, testimonials, pricing, FAQ, CTA. Fix: order sections by what the audience needs to believe, and cut what does not earn belief.
- Same number of items in every list (always three, always four). Fix: as many as there really are.
- Symmetry everywhere. Fix: one asymmetric moment per screen, with a reason.
- Perfectly even, perfectly predictable. Fix: one surprise per page; the direction's signature move.

## 3. Native beats custom

A custom component must clear a high bar: it has to be better than the native one on keyboard, screen reader, touch, focus visibility and performance, and it has to fit the direction. Most do not. Prefer: native `select`, `input`, `button`, `details`/`summary`, `dialog`, native scrolling and native form validation, styled through CSS custom properties, `accent-color`, `color-scheme`, borders, spacing and type. Where the direction demands a custom control (a knob in the control-panel direction), build it accessibly (role, keyboard, focus ring, labels) and use it in one place, not everywhere.

## 4. Usability sanity checks

Boldness must survive these; a design that fails them is not finished.
- Text contrast at least 4.5:1 for body text and 3:1 for large text and UI edges; check the accent on its background.
- Focus states visible and styled with the direction, not removed.
- Touch targets at least 44 by 44 CSS pixels on mobile; no hover-only affordances.
- `prefers-reduced-motion` honored: motion reduced to opacity or nothing.
- `prefers-color-scheme` honored if the design has a dark variant, and the page never flashes the wrong scheme.
- Images sized for the web (hero under about 400 KB, others under 150 KB, modern formats), with width and height attributes to avoid layout shift, and alt text that describes or is empty when decorative.
- Fonts loaded with `font-display: swap` or preloaded; no invisible text.
- Keyboard: every action reachable; no scroll hijacking without an escape.
- Real device widths tested: 390, 768, 1280, 1440 and one very wide (1920) where the composition must not fall apart.

## 5. Copy rewrite rules

- Write in the direction's voice, one register throughout.
- Specific over abstract: name the object, the number, the time saved.
- Short headlines, real sentences below them, no subtitle that restates the headline.
- No filler adjectives; if a word could describe any product, cut it.
- Let the copy be the design where the direction is typographic: rhythm, line breaks and scale are part of the writing.

## 6. The states pass

Empty, loading, error, partial and "nothing to do here" are screens people see, sometimes more often than the happy path, and they are where a direction usually falls apart into a gray spinner and a red banner. Each one is designed in the same direction as the rest, built, and screenshotted; an unstyled state is an unfinished screen, so name it as unstyled rather than reporting the surface complete.

- Empty: the direction's voice, one clear next action, no sad illustration.
- Loading: a skeleton or progress shaped like the content it precedes; no spinner in a void.
- Error: what happened and what to do, in the product's tone; no red wall.
- Partial: real data next to missing data without the missing part looking broken.
- Nothing to do: a calm screen that says so; a success state, not an empty one.
- Also for a full run: long text, the narrowest viewport, and the dark variant where one exists.

Screenshot states by applying them in the HTML (a query parameter or a class you toggle) and include them in the gate's screenshot set when they are part of the surface.
