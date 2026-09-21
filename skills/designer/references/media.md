# Media: images, video and how to make them belong to the page

Contents: 1. When to generate · 2. Image prompt craft · 3. Sets and consistency · 4. Making images belong · 5. Verify frame by frame · 6. Video workflows (fal.ai) · 7. Putting video on the page · 8. Keys, cost and auto-skip · 9. Fallbacks without a key

`<scripts>` below means the skill's scripts directory (`${CLAUDE_SKILL_DIR}/scripts`, the absolute path shown in SKILL.md). Run the scripts from the project root so `design/...` paths resolve.

## 1. When to generate

Coding agents default to gradients and shapes where a designer would use an image, and that is one of the most obvious signs of generated work. Generate imagery when:
- the critic or your own screenshot review says the page is "plain" or "shapes standing in for imagery";
- the Direction Brief calls for photography, illustration, 3D, texture or a scene;
- a section explains something that a picture would say faster;
- the hero has no object to look at.

Do not generate imagery to fill space. An image has to have a job: set the world, show the product, carry the concept's signature move.

## 2. Image prompt craft

Run `node <scripts>/gemini-image.mjs --prompt "..." --out design/assets/<name>.png --aspect <ratio>`. Good prompts read like a brief to an illustrator or a photographer:

- Subject: the one thing in the frame and what it is doing. One subject per image.
- Style: name the medium and the era from the direction ("risograph print, two spot colors, visible grain", "matte claymation still, soft studio light", "technical pen illustration on cream paper"). Style words from the direction keep every asset in the same world.
- Composition: where the subject sits, how much empty space, where the page's text will go ("subject in the right third, left two-thirds empty and quiet").
- Light and material: "single warm key light from the upper left", "brushed aluminum, matte, no reflections".
- Palette: hex values from the brief ("background exactly #F3EDE2, ink #1B1B1B, accent #D9480F").
- Background: "solid #F3EDE2 background, nothing else" when the asset will be cut out or blended; "seamless, edge-to-edge" for textures.
- Exclusions, as positive instruction where possible: "no text, no letters, no logos, no watermark, no people".
- Aspect ratio from the layout: 16:9 or 21:9 for heroes, 1:1 for cards, 4:5 or 9:16 for mobile-first heroes, 3:2 for editorial. Ask for `--size 2K` for heroes, 1K for everything else.

Use `--quality` (the premium model) for hero art and complex compositions; the default model is fine for textures, icons-as-images and secondary assets. Generate `--n 3` for heroes and pick; the first result is rarely the best.

Photoreal renders of specific real people, real brands and their marks, and text-heavy images are poor uses of the model; describe objects, scenes, materials and styles instead.

## 3. Sets and consistency

A page needs a family of images, not one hero. Keep them consistent:
- Write a style stem once ("<medium>, <era>, <light>, <palette>, <background>") and reuse it verbatim in every prompt, changing only the subject.
- Pass the first accepted image as `--ref` for the rest so the model matches its look.
- Generate all assets at the same size class and the same background so they can sit together.
- Name files by role: `hero.png`, `feature-timeline.png`, `texture-paper.png`.
- Record every prompt and model in the design record's media table; it is the only way to regenerate a matching asset later.

Editing: pass an existing image with `--ref` and describe the change ("same scene, remove the second cup, warmer light"). For cutouts, generate on a solid background matching the page and blend, rather than relying on transparency.

## 4. Making images belong

Images that sit on a page as rectangles look pasted. Integrate them:
- Blend: `mix-blend-mode: multiply` on paper-like backgrounds, `screen` on dark ones; generated textures over solid fills.
- Mask: `mask-image` with gradients or SVG shapes so the image dissolves into the background or into type.
- Set type into the image: headline overlapping the subject with a deliberate z-order, not a translucent box.
- Grade: a CSS `filter` (contrast, saturate, sepia at low values) to match all images to the palette.
- Depth: layers with parallax at small amounts, or CSS 3D transforms for a single object.
- Shaders and 3D for the signature moment: a small WebGL or canvas effect (refraction, displacement, grain) over an image, or a three.js scene for one hero object, with a static image fallback for reduced motion and low-end devices.
- Real grain: a tiled noise PNG at low opacity unifies mixed media better than any gradient.

## 5. Verify frame by frame

Media that looks right in isolation breaks pages: it shifts layout, covers text, loads late, or looks wrong at another width. After every media change:

```
node <scripts>/screenshot.mjs design/explorations/<slug>/index.html --out design/shots/<slug> --name m1 --viewports desktop,mobile --scroll 4
```

Read every shot. Check text legibility over images at both widths, cropping at mobile width, load order (poster or color before the image), and file weight. Then run a critic round; media changes the whole impression.

## 6. Video workflows (fal.ai)

Run `node <scripts>/fal-video.mjs check` first. Without `FAL_KEY` the script exits 2: write one line in the record ("video skipped: no FAL_KEY") and continue with images. With a key:

Looping animated graphic with a transparent background (a crystal that splinters and spins, say):
1. Generate the still with Gemini on a solid background in the page's background color, so refraction, shadows and edge light bake in against the right color.
2. `node <scripts>/fal-video.mjs loop --image design/assets/crystal.png --prompt "the crystal splinters apart and slowly rotates, glassy refraction, soft shadow on the ground, returns to the starting pose" --out design/assets/crystal-loop.webm --duration 5`
   The `loop` subcommand uses the same image as start and end frame so the clip loops seamlessly, then removes the background with a video matting model. Subjects are matted as objects by default; add `--person` for a human subject, `--keep-bg` to skip matting.
3. Place it with `<video autoplay muted loop playsinline>` over the page background; keep the still as `poster` and as the reduced-motion fallback.

Fluid transitions between states (a suitcase that floats, lands, opens, fills):
1. Generate keyframes with Gemini: frame A, then frame B using A as `--ref` ("same suitcase, same light, now open with contents inside"), then C from B.
2. For each pair: `node <scripts>/fal-video.mjs i2v --image A.png --end-image B.png --prompt "the suitcase lands softly and opens" --out design/assets/t-ab.mp4 --duration 4`
3. Scrub each clip with scroll (section 7). Consecutive clips share frames, so the sequence reads as one continuous shot.

Any other model: `node <scripts>/fal-video.mjs run --model <endpoint-id> --input '{"prompt": "...", "image_url": "design/assets/a.png"}' --out design/assets/x.mp4`. Local paths in `*_url` fields are uploaded automatically. Search fal.ai's model list for the current best image-to-video and matting models when the defaults (`bytedance/seedance-2.5/image-to-video`, `veed/video-background-removal`) are superseded; override with `--model` or the `FAL_I2V_MODEL` / `FAL_MATTING_MODEL` environment variables.

Keep clips short (3 to 6 seconds), 720p unless the hero needs 1080p, audio off. Video is the most expensive asset on the page in both money and bytes; one excellent clip beats five.

## 7. Putting video on the page

- Autoplaying loops: `<video autoplay muted loop playsinline preload="metadata" poster="still.png">`; muted is required for autoplay.
- Transparent video: VP9 WebM keeps alpha in Chromium and Firefox; Safari needs HEVC with alpha in a `.mov` (convert with ffmpeg if available: `ffmpeg -i in.webm -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -tag:v hvc1 out.mov` on a Mac, or `-c:v libx265` builds with alpha support). Provide both sources and the poster fallback.
- Scroll scrubbing: set `video.currentTime = progress * video.duration` from an IntersectionObserver or scroll listener with `requestAnimationFrame`; encode with frequent keyframes (`-g 1` or a small GOP) so seeking is smooth; preload the clip; show the first frame as a poster.
- Respect `prefers-reduced-motion`: pause and show the poster.
- Budget: a 5-second 720p clip should be under 2 MB; compress with ffmpeg (`-crf 28` for VP9, `-crf 23` for H.264) when needed.

## 8. Keys, cost and auto-skip

- Images: `GEMINI_API_KEY` (Google AI Studio). The script also reads a gitignored `.env.agents` in the project or `~/.claude/.env.agents`. Image calls are cheap; a page's full asset set is usually well under a dollar. Use `--list-models` when a model ID is rejected; the family changes names over time.
- Video: `FAL_KEY` (fal.ai dashboard). Clips cost real money per second; set a spend limit on the key and tell the user before generating more than a couple of clips.
- Auto-skip: missing key, exit code 2, one line in the record, continue. Never stop the loop to ask the user to create a key; mention at the end that adding the key unlocks that step.

## 9. Fallbacks without a key

These are real design moves, not consolation prizes:
- SVG illustration drawn for the direction: line art, isometric, cut paper; one stroke weight, one palette, one light source.
- Real texture in CSS: an SVG `feTurbulence` grain at low opacity, a fine dot or line pattern, paper fiber. Texture is the cheapest thing that separates designed from generated.
- Photography the user already has: ask once, early, and lay out around placeholders of the right aspect ratio until it arrives.
- Typographic imagery: an oversized numeral, a single glyph, a word set as the graphic. Restraint reads as confidence.

What is not a fallback: gradient orbs, blurred blobs, glows, and abstract shapes floating behind text. Those are the tells the Deliver stage exists to remove; leaving the space empty is better.
