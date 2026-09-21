#!/usr/bin/env node
// Lighthouse audit with an accessibility gate. Mechanical checks that taste misses: contrast
// ratios, missing labels and alt text, tap-target size, heading order, layout shift, and a page
// made slow by generated media. Runs Lighthouse through `npx --yes lighthouse` (nothing to
// install ahead of time). Local HTML files are served over a temporary local HTTP server because
// Lighthouse cannot audit file:// URLs.
//
// Usage: node lighthouse.mjs <url|file.html> [--out design/audits/<slug>] [--min-a11y 90] [--mobile]
// Prints a scores table, the failing accessibility / best-practices / SEO audits and the core
// performance metrics; writes lighthouse.json and lighthouse.html to --out.
// Exit codes: 0 ok, 1 accessibility below the gate, 2 Lighthouse could not run.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs, loadAgentEnv, findBrowser, ensureDir, mimeFromExt, log, fail } from './lib.mjs';

loadAgentEnv();
const args = parseArgs(process.argv.slice(2), { booleans: ['mobile', 'json'] });
const target = args._[0];
if (!target) fail(1, 'usage: node lighthouse.mjs <url|file.html> [--out dir] [--min-a11y 90] [--mobile]');
const out = typeof args.out === 'string' ? args.out : 'design/audits/latest';
const minA11y = Number(args['min-a11y'] || 90);
ensureDir(out);

let server = null;
let url = target;
if (!/^https?:\/\//i.test(target)) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) fail(1, `file not found: ${abs}`);
  const root = path.dirname(abs);
  server = http.createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.normalize(path.join(root, reqPath));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': mimeFromExt(file) });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(abs))}`;
  log(`serving ${root} at ${url}`);
}

const env = { ...process.env };
if (!env.CHROME_PATH) { const b = findBrowser(); if (b) env.CHROME_PATH = b; }
const chromeFlags = ['--headless=new', '--disable-gpu'];
if (process.platform !== 'win32' && typeof process.getuid === 'function' && process.getuid() === 0) chromeFlags.push('--no-sandbox');

const lhArgs = [
  '--yes', 'lighthouse', url, '--quiet',
  `--chrome-flags=${chromeFlags.join(' ')}`,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=json', '--output=html', `--output-path=${path.join(out, 'lighthouse')}`,
];
if (!args.mobile) lhArgs.splice(3, 0, '--preset=desktop');
log(`running: npx ${lhArgs.join(' ')}`);
// The local file server lives in this process, so Lighthouse must run asynchronously
// (a blocking spawnSync would stop the server from answering Chrome's requests).
const r = await new Promise((resolve) => {
  const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', lhArgs, { env, shell: process.platform === 'win32' });
  let stdout = '', stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  const timer = setTimeout(() => { child.kill('SIGKILL'); resolve({ stdout, stderr: stderr + '\nlighthouse timed out after 6 minutes' }); }, 6 * 60 * 1000);
  child.on('error', (error) => { clearTimeout(timer); resolve({ stdout, stderr, error }); });
  child.on('close', () => { clearTimeout(timer); resolve({ stdout, stderr }); });
});
if (server) server.close();

// Lighthouse names the files lighthouse.report.json / .report.html
for (const ext of ['json', 'html']) {
  const from = path.join(out, `lighthouse.report.${ext}`);
  if (fs.existsSync(from)) fs.renameSync(from, path.join(out, `lighthouse.${ext}`));
}
const jsonPath = path.join(out, 'lighthouse.json');
if (!fs.existsSync(jsonPath)) {
  fail(2, `Lighthouse produced no report for ${url}.\n${(r.stderr || r.stdout || r.error?.message || '').split('\n').filter(Boolean).slice(-6).join('\n')}\n  (needs Node, network access for npx to fetch lighthouse, and a Chromium browser; set CHROME_PATH if it is somewhere unusual)`);
}

const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const pct = (c) => Math.round((report.categories[c]?.score ?? 0) * 100);
const scores = { performance: pct('performance'), accessibility: pct('accessibility'), 'best-practices': pct('best-practices'), seo: pct('seo') };
const failing = (cat) => (report.categories[cat]?.auditRefs || [])
  .map((a) => report.audits[a.id])
  .filter((a) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
  .map((a) => { const n = a.details?.items?.length; return `- ${a.id}: ${a.title}${n ? ` (${n} element${n === 1 ? '' : 's'})` : ''}`; });
const perf = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time']
  .map((id) => report.audits[id]).filter(Boolean).map((a) => `- ${a.title}: ${a.displayValue ?? 'n/a'}`);

if (args.json) {
  process.stdout.write(JSON.stringify({ url, scores, failing: { accessibility: failing('accessibility'), 'best-practices': failing('best-practices'), seo: failing('seo') }, performance: perf, report: jsonPath }, null, 2) + '\n');
} else {
  console.log(`Lighthouse ${report.lighthouseVersion}  ${report.finalDisplayedUrl || url}  (${args.mobile ? 'mobile' : 'desktop'})`);
  console.log('| Category | Score |\n|---|---|');
  for (const [k, v] of Object.entries(scores)) console.log(`| ${k} | ${v} |`);
  for (const cat of ['accessibility', 'best-practices', 'seo']) {
    const f = failing(cat);
    if (f.length) { console.log(`\nFailing ${cat} audits:`); f.forEach((l) => console.log(l)); }
  }
  if (perf.length) { console.log('\nPerformance metrics:'); perf.forEach((l) => console.log(l)); }
  console.log(`\nReports: ${jsonPath}, ${path.join(out, 'lighthouse.html')}`);
}
if (scores.accessibility < minA11y) { log(`\nAccessibility ${scores.accessibility} is below the ${minA11y} gate.`); process.exit(1); }
