#!/usr/bin/env node
// Screenshot a page (URL or local HTML file) at one or more viewports.
// Uses Playwright when the project (or a global install) has it; otherwise falls back to
// a headless Chrome/Edge/Chromium binary found on the machine. Prints JSON with the files written.
//
// Usage:
//   node screenshot.mjs <url|file.html> [--out design/shots] [--name r1]
//                       [--viewports desktop,mobile] [--no-full] [--scroll 3] [--delay 1500]
//                       [--dark] [--scale 1] [--reduced-motion] [--wait-for "css selector"] [--engine auto|cli]
//                       [--critic-copy]
//
// Viewport presets: desktop 1440x900, laptop 1280x800, tablet 834x1112, mobile 390x844.
// Custom viewports: --viewports 1920x1080,375x667
// Output per viewport: <name>-<viewport>-full.png (whole page), <name>-<viewport>-top.png (first screen),
// and with --scroll N, N-1 more shots one viewport-height apart (what a user sees while scrolling).
// --critic-copy also writes copies with neutral names (no round token) under <out>/.critic/<random>/ and
// lists them as "criticFiles": hand those to the design critic so file names reveal nothing about history.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseArgs, loadAgentEnv, resolveModule, findBrowser, toFileUrl, ensureDir, printJson, log, fail } from './lib.mjs';

const PRESETS = { desktop: [1440, 900], laptop: [1280, 800], tablet: [834, 1112], mobile: [390, 844] };

loadAgentEnv();
const args = parseArgs(process.argv.slice(2), { booleans: ['no-full', 'dark', 'reduced-motion', 'critic-copy'] });
const target = args._[0];
if (!target) fail(1, 'usage: node screenshot.mjs <url|file.html> [--out dir] [--name base] [--viewports desktop,mobile] ...');

const opts = {
  out: args.out || 'design/shots',
  name: args.name || 'shot',
  full: !args['no-full'],
  scroll: Math.max(1, Number(args.scroll || 1)),
  delay: Number(args.delay || 1500),
  dark: !!args.dark,
  scale: Number(args.scale || 1),
  reducedMotion: !!args['reduced-motion'],
  waitFor: typeof args['wait-for'] === 'string' ? args['wait-for'] : null,
  fullHeight: Number(args['full-height'] || 4000),
  viewports: String(args.viewports || 'desktop,mobile').split(',').map((v) => v.trim()).filter(Boolean).map((v) => {
    if (PRESETS[v]) return { label: v, width: PRESETS[v][0], height: PRESETS[v][1] };
    const m = v.match(/^(\d+)x(\d+)$/);
    if (!m) fail(1, `unknown viewport "${v}" (use a preset or WIDTHxHEIGHT)`);
    return { label: v, width: Number(m[1]), height: Number(m[2]) };
  }),
};

let url;
try { url = toFileUrl(target); } catch (e) { fail(1, e.message); }
ensureDir(opts.out);

const engine = typeof args.engine === 'string' ? args.engine : 'auto'; // auto | playwright | cli
const pwPath = engine === 'cli' ? null : (resolveModule('playwright') || resolveModule('playwright-core'));
const metas = [];
let result;
if (pwPath) {
  try { result = await withPlaywright(pwPath); }
  catch (e) { log(`playwright failed (${e.message.split('\n')[0]}); falling back to a headless browser binary`); }
}
if (!result) {
  const browser = findBrowser();
  if (!browser) fail(3, 'no screenshot engine: install Chrome/Edge, or run `npm i -D playwright && npx playwright install chromium`');
  result = withCli(browser);
}
if (args['critic-copy']) {
  const token = crypto.randomBytes(3).toString('hex');
  const dir = path.join(opts.out, '.critic', token);
  ensureDir(dir);
  // Absolute paths, because the critic's Read tool needs them and the critic has no working directory of ours.
  result.criticFiles = result.files.map((f) => {
    const neutral = path.basename(f).replace(new RegExp(`^${opts.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`), '');
    const dest = path.resolve(dir, neutral);
    fs.copyFileSync(f, dest);
    return dest;
  });
}
printJson(result);

// ---------------------------------------------------------------------------
async function withPlaywright(modulePath) {
  const pw = await import(pathToImportUrl(modulePath));
  const chromium = (pw.chromium || pw.default?.chromium);
  if (!chromium) throw new Error('playwright module has no chromium export');
  const attempts = [
    () => chromium.launch(),
    () => chromium.launch({ channel: 'chrome' }),
    () => chromium.launch({ channel: 'msedge' }),
    () => { const p = findBrowser(); if (!p) throw new Error('no browser binary'); return chromium.launch({ executablePath: p }); },
  ];
  let browser, lastErr;
  for (const a of attempts) { try { browser = await a(); break; } catch (e) { lastErr = e; } }
  if (!browser) throw lastErr || new Error('could not launch chromium');

  const files = [];
  try {
    for (const vp of opts.viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: opts.scale,
        colorScheme: opts.dark ? 'dark' : 'light',
        reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
        isMobile: vp.width < 600,
        hasTouch: vp.width < 600,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e.message || e)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
      catch { await page.goto(url, { waitUntil: 'load', timeout: 45000 }); }
      try { await page.evaluate(() => (document.fonts ? document.fonts.ready : null)); } catch { /* ignore */ }
      if (opts.waitFor) { try { await page.waitForSelector(opts.waitFor, { timeout: 15000 }); } catch { log(`wait-for "${opts.waitFor}" timed out; continuing`); } }
      await page.waitForTimeout(opts.delay);

      const base = path.join(opts.out, `${opts.name}-${vp.label}`);
      if (opts.full) {
        const f = `${base}-full.png`;
        await page.screenshot({ path: f, fullPage: true });
        files.push(f);
      }
      const pageHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
      for (let i = 0; i < opts.scroll; i++) {
        const y = i * vp.height;
        if (i > 0) {
          if (y >= pageHeight) break;
          await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
          await page.waitForTimeout(Math.min(800, opts.delay));
        }
        const f = `${base}-${i === 0 ? 'top' : `scroll${i}`}.png`;
        await page.screenshot({ path: f, fullPage: false });
        files.push(f);
      }
      const meta = { viewport: vp.label, pageHeight, consoleErrors: errors.slice(0, 10) };
      if (errors.length) log(`[${vp.label}] ${errors.length} console/page error(s); first: ${errors[0]}`);
      metas.push(meta);
      await context.close();
    }
  } finally { await browser.close(); }
  return { engine: 'playwright', url, files, pages: metas };
}

function withCli(browserPath) {
  const files = [];
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ud-shot-'));
  try {
    for (const vp of opts.viewports) {
      const base = path.join(opts.out, `${opts.name}-${vp.label}`);
      const shots = [{ suffix: 'top', height: vp.height }];
      if (opts.full) shots.push({ suffix: 'full', height: Math.max(vp.height, opts.fullHeight) });
      for (const s of shots) {
        const f = path.resolve(`${base}-${s.suffix}.png`);
        const cliArgs = [
          '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
          '--disable-extensions', `--user-data-dir=${profile}`, `--window-size=${vp.width},${s.height}`,
          `--force-device-scale-factor=${opts.scale}`, `--screenshot=${f}`,
          `--virtual-time-budget=${opts.delay + 2500}`, '--timeout=45000',
        ];
        if (vp.width < 600) cliArgs.push(`--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`);
        if (opts.dark) cliArgs.push('--force-dark-mode');
        if (process.platform !== 'win32' && typeof process.getuid === 'function' && process.getuid() === 0) cliArgs.push('--no-sandbox');
        cliArgs.push(url);
        const r = spawnSync(browserPath, cliArgs, { encoding: 'utf8', timeout: 90000 });
        if (fs.existsSync(f)) files.push(path.relative(process.cwd(), f));
        else log(`no screenshot produced for ${vp.label}/${s.suffix}: ${(r.stderr || r.error?.message || '').split('\n').slice(-3).join(' ')}`);
      }
    }
  } finally { fs.rmSync(profile, { recursive: true, force: true }); }
  if (opts.scroll > 1) log('note: --scroll needs Playwright; the headless-binary fallback only captures top and full views');
  if (opts.dark) log('note: without Playwright, --dark forces dark rendering of the page rather than emulating prefers-color-scheme: dark');
  if (opts.reducedMotion || opts.waitFor) log('note: --reduced-motion and --wait-for need Playwright and were ignored');
  if (!files.length) fail(4, 'the headless browser produced no screenshots (see messages above)');
  return { engine: 'headless-binary', browser: browserPath, url, files, note: opts.full ? `"full" shots are a ${opts.fullHeight}px-tall window, not a true full-page capture; pass --full-height to change` : undefined };
}

function pathToImportUrl(p) {
  if (/^[a-z]+:\/\//i.test(p)) return p;
  let abs = path.resolve(p).replace(/\\/g, '/');
  if (!abs.startsWith('/')) abs = '/' + abs;
  return 'file://' + abs;
}
