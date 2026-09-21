#!/usr/bin/env node
// Generate or edit images with the Gemini API (Nano Banana family). No dependencies.
//
// Key: GEMINI_API_KEY (or GOOGLE_API_KEY) from the environment, or from a .env.agents file
// in the project (any parent directory) or ~/.claude/.env.agents. Never commit that file.
//
// Usage:
//   node gemini-image.mjs --prompt "..." --out design/assets/hero.png [--aspect 16:9] [--size 1K|2K|4K]
//                         [--model gemini-3.1-flash-image | --quality] [--ref style.png --ref logo.png] [--n 3]
//   node gemini-image.mjs --list-models
//
// --ref     attach an image the model should edit or take style/subject cues from (repeatable)
// --quality use the premium model (gemini-3-pro-image) for hero art or complex compositions
// --n       generate several variations (files get -1, -2, ... suffixes)
// Output: JSON on stdout ({ files, model, text }); progress and errors on stderr.
// The output extension is corrected to match what the API returned (png/jpg/webp).
import fs from 'node:fs';
import {
  parseArgs, loadAgentEnv, firstEnv, mimeFromExt, alignExtension, fetchJson, collectInlineMedia,
  ensureParent, printJson, log, fail, withIndex, summarizeError,
} from './lib.mjs';

loadAgentEnv();
const API = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const QUALITY_MODEL = process.env.GEMINI_IMAGE_QUALITY_MODEL || 'gemini-3-pro-image';
const ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

const args = parseArgs(process.argv.slice(2), { booleans: ['quality', 'list-models', 'help'] });
const key = firstEnv('GEMINI_API_KEY', 'GOOGLE_API_KEY');
if (!key) fail(2, 'GEMINI_API_KEY is not set. Create a key in Google AI Studio, then export it, add it to ~/.claude/settings.json under "env", or put GEMINI_API_KEY=... in a gitignored .env.agents file.');
const headers = { 'x-goog-api-key': key.value, 'Content-Type': 'application/json' };

try {
  await main();
} catch (e) {
  fail(5, e.message);
}

async function listImageModels() {
  let body;
  try { body = await fetchJson(`${API}/models?pageSize=200`, { headers }); }
  catch (e) { fail(4, `could not list models: ${e.message}`); }
  return (body.models || [])
    .filter((m) => /image/i.test(m.name) && (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => ({ id: m.name.replace(/^models\//, ''), displayName: m.displayName, description: (m.description || '').slice(0, 120) }));
}

async function main() {
  if (args['list-models']) { printJson({ models: await listImageModels() }); return; }

  let prompt = typeof args.prompt === 'string' ? args.prompt : null;
  if (!prompt && typeof args['prompt-file'] === 'string') prompt = fs.readFileSync(args['prompt-file'], 'utf8').trim();
  if (!prompt || args.help) fail(1, 'usage: node gemini-image.mjs --prompt "..." --out file.png [--aspect 16:9] [--size 2K] [--ref img.png] [--quality] [--n 2]');

  const out = typeof args.out === 'string' ? args.out : 'design/assets/image.png';
  let model = typeof args.model === 'string' ? args.model : (args.quality ? QUALITY_MODEL : DEFAULT_MODEL);
  const explicitModel = typeof args.model === 'string';
  const count = Math.max(1, Math.min(8, Number(args.n || 1)));
  const refs = [].concat(args.ref || []).filter((r) => typeof r === 'string');

  const imageCfg = {};
  if (typeof args.aspect === 'string') {
    if (!ASPECTS.includes(args.aspect)) log(`note: aspect "${args.aspect}" is not in the documented list (${ASPECTS.join(', ')}); trying anyway`);
    imageCfg.aspectRatio = args.aspect;
  }
  if (args.size) imageCfg.imageSize = String(args.size).toUpperCase();

  const parts = [{ text: prompt }];
  for (const r of refs) {
    if (!fs.existsSync(r)) fail(1, `reference image not found: ${r}`);
    parts.push({ inline_data: { mime_type: mimeFromExt(r), data: fs.readFileSync(r).toString('base64') } });
  }

  // The image-config field has been renamed across API revisions; try the known spellings in order
  // and fall back to no config (the model then infers aspect ratio from the prompt or reference).
  const variants = [];
  if (Object.keys(imageCfg).length) {
    variants.push({ label: 'imageConfig', generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: imageCfg } });
    variants.push({ label: 'responseFormat', generationConfig: { responseModalities: ['TEXT', 'IMAGE'], responseFormat: { image: imageCfg } } });
  }
  variants.push({ label: 'plain', generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } });

  const files = [];
  let lastText = '';
  let variantIndex = 0; // remembered across --n iterations so a rejected spelling is not retried
  let modelResolved = false;

  for (let i = 0; i < count; i++) {
    let res;
    for (;;) {
      const v = variants[variantIndex];
      try {
        res = await fetchJson(`${API}/models/${model}:generateContent`, {
          method: 'POST', headers, body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: v.generationConfig }),
        }, { retries: 3 });
        break;
      } catch (e) {
        const msg = (e.body && summarizeError(e.body)) || e.message;
        if (e.status === 400 && /unknown name|invalid json payload|cannot find field|responseFormat|imageConfig|image_config/i.test(msg) && variantIndex < variants.length - 1) {
          log(`  config style "${v.label}" rejected (${msg.split('\n')[0].slice(0, 140)}); trying the next spelling`);
          variantIndex++;
          continue;
        }
        if (e.status === 404 && !explicitModel && !modelResolved) {
          modelResolved = true;
          const models = await listImageModels();
          const pick = models.find((m) => /flash/i.test(m.id) && !/lite/i.test(m.id)) || models[0];
          if (pick) { log(`  model "${model}" not found; using "${pick.id}" instead (set GEMINI_IMAGE_MODEL to pin one)`); model = pick.id; continue; }
        }
        if (e.status === 404) fail(4, `model "${model}" not found. List current image models with --list-models`);
        if (e.status === 400 || e.status === 403) fail(4, `${msg}\n  (check the key, the aspect/size values, and that the model "${model}" exists: node gemini-image.mjs --list-models)`);
        fail(5, msg);
      }
    }

    const media = collectInlineMedia(res).filter((m) => m.mime.startsWith('image/'));
    lastText = (res.candidates || []).flatMap((c) => (c.content?.parts || [])).map((p) => p.text).filter(Boolean).join('\n').trim();
    if (!media.length) {
      const block = res.promptFeedback?.blockReason || res.candidates?.[0]?.finishReason;
      fail(6, `no image returned${block ? ` (reason: ${block})` : ''}${lastText ? `\n  model said: ${lastText.slice(0, 300)}` : ''}\n  Rephrase the prompt: avoid real people, brands, logos and text-heavy requests; describe subject, style, lighting, palette and background instead.`);
    }
    media.forEach((m, j) => {
      let file = withIndex(out, i, count);
      if (media.length > 1) file = withIndex(file, j, media.length);
      const aligned = alignExtension(file, m.mime);
      if (aligned !== file) log(`  note: API returned ${m.mime}; saving as ${aligned}`);
      ensureParent(aligned);
      fs.writeFileSync(aligned, Buffer.from(m.data, 'base64'));
      files.push(aligned);
      log(`wrote ${aligned} (${m.mime}, ${(fs.statSync(aligned).size / 1024).toFixed(0)} KB)`);
    });
    if (count > 1) log(`variation ${i + 1}/${count} done`);
  }

  const used = variants[variantIndex].label;
  if (Object.keys(imageCfg).length && used === 'plain') log('note: the API rejected the aspect/size config in every known spelling; the image was generated without it');
  printJson({ files, model, text: lastText || undefined, configStyle: used });
}
