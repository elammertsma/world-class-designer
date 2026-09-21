// Shared helpers for the world-class-designer scripts. No dependencies beyond Node 18+.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

/**
 * Minimal argv parser: --key value, --flag, --key=value, repeated --key a --key b -> array.
 * Pass the names of boolean flags so `--dark index.html` does not swallow the positional.
 */
export function parseArgs(argv, { booleans = [] } = {}) {
  const args = { _: [] };
  const bools = new Set(booleans);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) { push(args, a.slice(2, eq), a.slice(eq + 1)); continue; }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (bools.has(key) || next === undefined || (next.startsWith('--') && next.length > 2)) args[key] = true;
      else { push(args, key, next); i++; }
    } else args._.push(a);
  }
  return args;
}
function push(args, key, value) {
  if (args[key] === undefined || args[key] === true) args[key] = value;
  else args[key] = [].concat(args[key], value);
}

/**
 * Load API keys from .env.agents files without overriding variables already set.
 * Search order: every directory from cwd upward, then ~/.claude/.env.agents.
 * Returns the list of files that were read.
 */
export function loadAgentEnv() {
  const files = [];
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const f = path.join(dir, '.env.agents');
    if (fs.existsSync(f)) files.push(f);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const home = path.join(os.homedir(), '.claude', '.env.agents');
  if (fs.existsSync(home)) files.push(home);
  // Closest file wins, so apply from farthest to nearest.
  for (const f of files.slice().reverse()) applyEnvFile(f);
  return files;
}
function applyEnvFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined || process.env[m[1]] === '') process.env[m[1]] = value;
  }
}

export function firstEnv(...names) {
  for (const n of names) if (process.env[n]) return { name: n, value: process.env[n] };
  return null;
}

export function mimeFromExt(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/markdown',
    '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  }[ext] || 'application/octet-stream';
}

export function extFromMime(mime) {
  return {
    'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4',
    'video/webm': '.webm', 'video/quicktime': '.mov',
  }[(mime || '').split(';')[0].trim()] || '';
}

export function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
export function ensureParent(file) { ensureDir(path.dirname(file)); }
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function log(...m) { console.error(...m); }
export function fail(code, message) { console.error(`error: ${message}`); process.exit(code); }
export function printJson(obj) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); }

/** fetch with retry on 429/5xx and on network errors. Returns the Response. */
export async function fetchWithRetry(url, options = {}, { retries = 3, baseDelay = 2000, retryOn = [429, 500, 502, 503, 504] } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!retryOn.includes(res.status) || attempt === retries) return res;
      log(`  retrying after HTTP ${res.status} (attempt ${attempt + 1}/${retries})...`);
    } catch (err) {
      lastErr = err;
      if (attempt === retries) throw err;
      log(`  retrying after network error: ${err.message} (attempt ${attempt + 1}/${retries})...`);
    }
    await sleep(baseDelay * Math.pow(2, attempt));
  }
  throw lastErr;
}

export async function fetchJson(url, options = {}, retryOpts) {
  const res = await fetchWithRetry(url, options, retryOpts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${url.split('?')[0]}: ${summarizeError(body)}`);
    err.status = res.status; err.body = body;
    throw err;
  }
  return body;
}
export function summarizeError(body) {
  if (!body) return '';
  if (body.error && typeof body.error === 'object') return body.error.message || JSON.stringify(body.error).slice(0, 400);
  if (body.detail) return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail).slice(0, 400);
  return (body.raw || JSON.stringify(body)).slice(0, 400);
}

/** Walk any JSON tree and collect objects that look like inline media (base64 data + mime type). */
export function collectInlineMedia(node, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) { node.forEach((n) => collectInlineMedia(n, found)); return found; }
  const mime = node.mimeType || node.mime_type;
  if (typeof node.data === 'string' && typeof mime === 'string' && node.data.length > 100) found.push({ mime, data: node.data });
  for (const v of Object.values(node)) collectInlineMedia(v, found);
  return found;
}

/** Resolve a module the way the *project* would (from cwd), then globally via NODE_PATH. */
export function resolveModule(name) {
  const candidates = [path.join(process.cwd(), 'noop.js'), path.join(os.homedir(), 'noop.js'), import.meta.url];
  for (const from of candidates) {
    try { return createRequire(from).resolve(name); } catch { /* keep looking */ }
  }
  const npmRoot = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (npmRoot.status === 0 && npmRoot.stdout.trim()) {
    try { return createRequire(path.join(npmRoot.stdout.trim(), 'noop.js')).resolve(name); } catch { /* not installed globally */ }
  }
  return null;
}

/** Give a file the extension that matches its actual media type (png/jpg/webp, mp4/webm/mov). */
export function alignExtension(file, mime) {
  const want = extFromMime(mime);
  if (!want) return file;
  const have = path.extname(file).toLowerCase();
  const same = (a, b) => a === b || (['.jpg', '.jpeg'].includes(a) && ['.jpg', '.jpeg'].includes(b));
  if (same(have, want)) return file;
  return (have ? file.slice(0, -have.length) : file) + want;
}

/** Warn when an .env.agents file inside a git repo is not ignored (keys would be committed). */
export function envFileGitWarning(file) {
  const dir = path.dirname(file);
  if (dir === path.join(os.homedir(), '.claude')) return null;
  const git = spawnSync('git', ['check-ignore', '-q', file], { cwd: dir, encoding: 'utf8' });
  if (git.error) return null; // git not installed: nothing to say
  if (git.status === 0) return null; // ignored, good
  const inRepo = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir, encoding: 'utf8' });
  if (inRepo.status !== 0) return null; // not a repo
  return `${file} is inside a git repository but not ignored; add ".env.agents" to .gitignore before committing`;
}

export function which(cmd) {
  const tool = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(tool, [cmd], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const first = r.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  return first || null;
}

/** Find a Chromium-based browser executable for headless screenshots. */
export function findBrowser() {
  const env = process.env.CHROME_PATH || process.env.BROWSER_PATH;
  if (env && fs.existsSync(env)) return env;
  const candidates = [];
  if (process.platform === 'win32') {
    const roots = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean);
    for (const r of roots) {
      candidates.push(
        path.join(r, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(r, 'Chromium', 'Application', 'chrome.exe'),
        path.join(r, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      );
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Arc.app/Contents/MacOS/Arc',
    );
  } else {
    for (const c of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'brave-browser']) {
      const p = which(c); if (p) return p;
    }
    if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
      const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
      try {
        for (const d of fs.readdirSync(root)) {
          if (!d.startsWith('chromium')) continue;
          for (const p of [path.join(root, d, 'chrome-linux', 'chrome'), path.join(root, d, 'chrome-linux64', 'chrome'), path.join(root, d)]) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) candidates.push(p);
          }
        }
      } catch { /* ignore */ }
    }
  }
  return candidates.find((c) => fs.existsSync(c)) || null;
}

export function toFileUrl(target) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target) || target.startsWith('data:')) return target;
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) throw new Error(`file not found: ${abs}`);
  let p = abs.replace(/\\/g, '/');
  if (!p.startsWith('/')) p = '/' + p; // Windows drive letters
  return 'file://' + encodeURI(p);
}

export function withIndex(file, index, count) {
  if (count <= 1) return file;
  const ext = path.extname(file);
  return file.slice(0, file.length - ext.length) + `-${index + 1}` + ext;
}
