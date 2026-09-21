# Credits and notices

## Process

The design process implemented here comes from Anshu Chimala's article "How to turn your AI into a world-class designer" (Lenny's Newsletter, September 2026): seed strings for variety, ambitious and specific briefs, the brainstorm-then-sharpen ladder, a screenshot-only critic in a fresh context, image and video generation, and the subtraction pass. The prompts in this repository are adaptations written for Claude Code; the short prompt templates in `references/directions.md` paraphrase the article's examples. The article's final section (removing AI tells) is behind a paywall and is not reproduced; the checklist in `references/ai-tells.md` is an independent reconstruction.

## Measurements and protocol

The critic protocol (three critics per round with the median score, the cached reference brief written once from inspiration images instead of showing critics the images, the rules tally kept apart from the quality score, Sonnet for pairwise spot checks only, and the resource budget for implementers and browsers) follows findings published by the design-director project:

    design-director, https://github.com/j-withmission/design-director
    MIT License, Copyright (c) 2026 Jason Prunty

The five-axis reading used by the brief writer (palette, composition, focus, density, light and material) and the read / resolution / translation / rules structure of the brief are adapted from that project's reference brief. The prompt texts, scripts and process in this repository were written independently.

## Third-party services

The optional media scripts call the Google Gemini API and fal.ai with keys the user supplies. Nothing in this repository sends data anywhere else.
