#!/usr/bin/env node
// Reports which media and screenshot capabilities this machine has, so the skill
// can decide what to use without asking the user. Never prints key values.
//
// Usage: node check-env.mjs [--json]
import { loadAgentEnv, firstEnv, resolveModule, findBrowser, which, printJson, parseArgs, envFileGitWarning } from './lib.mjs';

const args = parseArgs(process.argv.slice(2), { booleans: ['json'] });
const envFiles = loadAgentEnv();
const warnings = envFiles.map(envFileGitWarning).filter(Boolean);

const gemini = firstEnv('GEMINI_API_KEY', 'GOOGLE_API_KEY');
const fal = firstEnv('FAL_KEY');
const playwright = resolveModule('playwright') || resolveModule('playwright-core');
const browser = findBrowser();
const ffmpeg = which('ffmpeg');
const major = Number(process.versions.node.split('.')[0]);

const report = {
  node: { version: process.version, ok: major >= 18 },
  gemini: { available: !!gemini, source: gemini ? gemini.name : null, model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image (default)' },
  fal: { available: !!fal, source: fal ? fal.name : null },
  screenshots: {
    playwright: !!playwright,
    playwrightPath: playwright || null,
    browser: browser || null,
    ok: !!(playwright || browser),
  },
  ffmpeg: ffmpeg || null,
  envFilesLoaded: envFiles,
  warnings,
};

if (args.json) { printJson(report); process.exit(0); }

const yes = (b) => (b ? 'yes' : 'no');
console.log(`node ${process.version} ${report.node.ok ? '' : '(needs 18+)'}`.trim());
console.log(`images (Gemini):   ${yes(report.gemini.available)}${gemini ? ` via ${gemini.name}` : '  -> set GEMINI_API_KEY to enable image generation'}`);
console.log(`video (fal.ai):    ${yes(report.fal.available)}${fal ? ' via FAL_KEY' : '  -> no FAL_KEY; video steps will be skipped'}`);
console.log(`screenshots:       ${report.screenshots.ok ? 'yes' : 'NO'}${playwright ? ' (playwright)' : browser ? ` (headless ${browser})` : '  -> install Chrome/Edge or run: npm i -D playwright && npx playwright install chromium'}`);
console.log(`ffmpeg:            ${yes(!!ffmpeg)} (optional; only for trimming/converting clips)`);
if (envFiles.length) console.log(`env files loaded:  ${envFiles.join(', ')}`);
for (const w of warnings) console.log(`WARNING: ${w}`);
if (!report.screenshots.ok) console.log('\nScreenshots are required for the design loop. Install Chrome or Edge, or in the project run: npm i -D playwright && npx playwright install chromium');
process.exit(report.screenshots.ok ? 0 : 3);
