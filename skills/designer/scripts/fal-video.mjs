#!/usr/bin/env node
// Video generation and matting through fal.ai's queue API. No dependencies.
//
// Key: FAL_KEY from the environment, or from .env.agents (project, any parent dir, or ~/.claude/).
// Without a key, every subcommand except `check` exits with code 2 so the skill can skip video work.
//
// Subcommands:
//   check                                             -> exit 0 if FAL_KEY is available, 2 if not
//   i2v  --image A.png [--end-image B.png] --prompt "motion description" --out clip.mp4
//        [--duration 5] [--resolution 720p] [--audio] [--model bytedance/seedance-2.5/image-to-video]
//   loop --image A.png --prompt "..." --out clip.webm [--keep-bg] [--person] [--duration 5]
//        (start frame == end frame so the clip loops seamlessly; background removed unless --keep-bg)
//   remove-bg --video clip.mp4 --out clip.webm [--codec vp9|h264] [--person]
//        (subjects are treated as objects unless --person is given)
//   run  --model <endpoint-id> --input '{"json":"..."}' | --input-file in.json --out result.ext
//        (generic: any fal model; the first output file URL is downloaded to --out)
//   upload <file>                                     -> prints the CDN URL for a local file
//
// Inputs given as local paths are uploaded to fal's CDN first; URLs and data: URIs pass through.
// Output file extensions are corrected to match the returned media type.
// Output: JSON on stdout ({ files, model, ... }); progress on stderr.
import fs from 'node:fs';
import path from 'node:path';
import {
  parseArgs, loadAgentEnv, firstEnv, mimeFromExt, alignExtension, fetchJson, fetchWithRetry, sleep,
  ensureParent, printJson, log, fail,
} from './lib.mjs';

loadAgentEnv();
const QUEUE = 'https://queue.fal.run';
const REST = 'https://rest.alpha.fal.ai';
const MODELS = {
  i2v: process.env.FAL_I2V_MODEL || 'bytedance/seedance-2.5/image-to-video',
  removeBg: process.env.FAL_MATTING_MODEL || 'veed/video-background-removal',
};

const args = parseArgs(process.argv.slice(2), { booleans: ['audio', 'keep-bg', 'person', 'help'] });
const cmd = args._[0];
const key = firstEnv('FAL_KEY');

if (cmd === 'check') {
  printJson({ fal: !!key });
  if (!key) log('FAL_KEY not set; video generation is skipped. Get a key at fal.ai (Dashboard -> Keys) to enable it.');
  process.exit(key ? 0 : 2);
}
if (!cmd || args.help) usage(1);
if (!key) fail(2, 'FAL_KEY is not set; skipping video. Add FAL_KEY to your environment, ~/.claude/settings.json "env", or a gitignored .env.agents file.');
const headers = { Authorization: `Key ${key.value}`, 'Content-Type': 'application/json' };
const timeoutMs = Number(args.timeout || 20 * 60) * 1000;
const pollMs = Number(args.poll || 4) * 1000;

try {
  await main();
} catch (e) {
  if (e.status === 401 || e.status === 403) fail(3, `fal.ai rejected the key (${e.message}). Check FAL_KEY.`);
  if (e.status === 404) fail(4, `${e.message}\n  The model endpoint may have been renamed; find the current one on fal.ai/models and pass --model or set FAL_I2V_MODEL / FAL_MATTING_MODEL.`);
  if (e.status === 422) fail(4, `${e.message}\n  The model rejected an input value (duration, resolution, image size...). Check the model's API page on fal.ai.`);
  fail(5, e.message);
}

async function main() {
  switch (cmd) {
    case 'upload': {
      const file = args._[1];
      if (!file) usage(1);
      printJson({ url: await toUrl(file) });
      return;
    }
    case 'i2v': {
      const out = str(args.out) || 'design/assets/clip.mp4';
      printJson(await imageToVideo({ image: str(args.image), endImage: str(args['end-image']), prompt: str(args.prompt), out, duration: args.duration, resolution: str(args.resolution), audio: !!args.audio, model: str(args.model) }));
      return;
    }
    case 'loop': {
      const image = str(args.image);
      if (!image) usage(1);
      const out = str(args.out) || 'design/assets/loop.webm';
      const raw = args['keep-bg'] ? out : out.replace(/\.[a-z0-9]+$/i, '') + '.raw.mp4';
      const gen = await imageToVideo({
        image, endImage: image, out: raw, duration: args.duration, resolution: str(args.resolution), audio: false, model: str(args.model),
        prompt: str(args.prompt) || 'subtle continuous motion, camera locked, returns exactly to the starting pose',
      });
      if (args['keep-bg']) { printJson(gen); return; }
      // Matting reads the clip straight from fal's CDN; no need to re-upload the download.
      const matte = await removeBackground({ video: gen.videoUrl || gen.files[0], out, codec: str(args.codec), person: !!args.person });
      printJson({ ...matte, sourceClip: gen.files[0], generation: gen });
      return;
    }
    case 'remove-bg': {
      const out = str(args.out) || 'design/assets/clip.webm';
      printJson(await removeBackground({ video: str(args.video), out, codec: str(args.codec), person: !!args.person }));
      return;
    }
    case 'run': {
      const model = str(args.model);
      let input = str(args.input) ? JSON.parse(args.input) : null;
      if (!input && str(args['input-file'])) input = JSON.parse(fs.readFileSync(args['input-file'], 'utf8'));
      if (!model || !input) usage(1);
      for (const [k, v] of Object.entries(input)) {
        if (typeof v === 'string' && /_url$/.test(k) && !/^(https?:|data:)/.test(v) && fs.existsSync(v)) input[k] = await toUrl(v);
      }
      const output = await runModel(model, input);
      const files = await downloadOutputs(output, str(args.out) || 'design/assets/output');
      printJson({ files, model, output: stripLong(output) });
      return;
    }
    default: usage(1);
  }
}

// ---------------------------------------------------------------------------
function str(v) { return typeof v === 'string' ? v : undefined; }
function usage(code) {
  const lines = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  log(lines.filter((l) => l.startsWith('//')).slice(0, 24).map((l) => l.slice(3)).join('\n'));
  process.exit(code);
}

async function imageToVideo({ image, endImage, prompt, out, duration, resolution, audio, model }) {
  if (!image || !prompt) usage(1);
  for (const f of [image, endImage].filter(Boolean)) {
    if (!/^(https?:|data:)/.test(f) && !mimeFromExt(f).startsWith('image/')) fail(1, `${f} is not an image (png, jpg, webp)`);
  }
  const endpoint = model || MODELS.i2v;
  const input = { prompt, image_url: await toUrl(image), generate_audio: !!audio };
  if (endImage) input.end_image_url = await toUrl(endImage);
  if (duration !== undefined && duration !== true) input.duration = String(duration);
  if (resolution) input.resolution = resolution;
  log(`fal: ${endpoint} (${input.duration || 'auto'}s, ${resolution || 'default resolution'}${endImage ? ', with end frame' : ''})`);
  const output = await runModel(endpoint, input);
  const files = await downloadOutputs(output, out);
  const videoUrl = findFileObjects(output)[0]?.url;
  return { files, videoUrl, model: endpoint, seed: output.seed };
}

async function removeBackground({ video, out, codec, person }) {
  if (!video) usage(1);
  const endpoint = MODELS.removeBg;
  const input = { video_url: await toUrl(video), output_codec: codec || 'vp9', refine_foreground_edges: true, subject_is_person: !!person };
  log(`fal: ${endpoint} (${input.output_codec}, ${person ? 'person' : 'object'} subject)`);
  const output = await runModel(endpoint, input);
  const files = await downloadOutputs(output, out);
  return {
    files, model: endpoint,
    note: input.output_codec === 'vp9' ? 'VP9 WebM keeps the alpha channel (transparent background) in Chromium and Firefox. Safari needs an HEVC .mov with alpha; keep a poster image as the fallback.' : undefined,
  };
}

async function runModel(modelId, input) {
  const submit = await fetchJson(`${QUEUE}/${modelId}`, { method: 'POST', headers, body: JSON.stringify(input) });
  const statusUrl = submit.status_url || `${QUEUE}/${modelId}/requests/${submit.request_id}/status`;
  const responseUrl = submit.response_url || `${QUEUE}/${modelId}/requests/${submit.request_id}`;
  const start = Date.now();
  let lastLog = 0;
  for (;;) {
    const st = await fetchJson(`${statusUrl}?logs=1`, { headers }, { retries: 5 });
    if (st.status === 'COMPLETED') break;
    const logs = st.logs || [];
    for (const l of logs.slice(lastLog)) if (l.message) log(`  ${l.message}`);
    lastLog = logs.length;
    const secs = Math.round((Date.now() - start) / 1000);
    log(`  ${st.status}${st.queue_position !== undefined ? ` (queue position ${st.queue_position})` : ''} ${secs}s`);
    if (Date.now() - start > timeoutMs) fail(7, `timed out after ${Math.round(timeoutMs / 1000)}s waiting for ${modelId} (request ${submit.request_id})`);
    await sleep(pollMs);
  }
  const result = await fetchJson(responseUrl, { headers }, { retries: 5 });
  if (result.error || result.detail) fail(8, `fal returned an error: ${JSON.stringify(result.error || result.detail).slice(0, 500)}`);
  return result;
}

function findFileObjects(node, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) { node.forEach((n) => findFileObjects(n, found)); return found; }
  if (typeof node.url === 'string' && /^https?:/.test(node.url)) found.push(node);
  for (const v of Object.values(node)) findFileObjects(v, found);
  return found;
}
function stripLong(output) { return JSON.parse(JSON.stringify(output, (k, v) => (typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + '...' : v))); }

async function downloadOutputs(output, out) {
  const objs = findFileObjects(output);
  if (!objs.length) fail(9, `no file URLs in the model output: ${JSON.stringify(output).slice(0, 500)}`);
  const files = [];
  for (let i = 0; i < objs.length; i++) {
    const o = objs[i];
    let file = objs.length > 1 ? out.replace(/(\.[a-z0-9]+)?$/i, `-${i + 1}$1`) : out;
    const mime = o.content_type || mimeFromExt(new URL(o.url).pathname);
    const aligned = alignExtension(file, mime);
    if (aligned !== file) log(`  note: output is ${mime}; saving as ${aligned}`);
    file = aligned;
    ensureParent(file);
    const res = await fetchWithRetry(o.url, {}, { retries: 3 });
    if (!res.ok) fail(9, `download failed (${res.status}) for ${o.url}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    log(`wrote ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB)`);
    files.push(file);
  }
  return files;
}

async function toUrl(ref) {
  if (/^(https?:|data:)/.test(ref)) return ref;
  if (!fs.existsSync(ref)) fail(1, `file not found: ${ref}`);
  const contentType = mimeFromExt(ref);
  try {
    const init = await fetchJson(`${REST}/storage/upload/initiate?storage_type=fal-cdn-v3`, {
      method: 'POST', headers, body: JSON.stringify({ content_type: contentType, file_name: path.basename(ref) }),
    });
    const put = await fetchWithRetry(init.upload_url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: fs.readFileSync(ref) });
    if (!put.ok) throw new Error(`upload PUT failed with ${put.status}`);
    log(`uploaded ${ref} -> ${init.file_url}`);
    return init.file_url;
  } catch (e) {
    if (e.status === 401 || e.status === 403) throw e;
    const size = fs.statSync(ref).size;
    if (contentType.startsWith('image/') && size < 8 * 1024 * 1024) {
      log(`upload failed (${e.message}); sending the image inline as a data URI instead`);
      return `data:${contentType};base64,${fs.readFileSync(ref).toString('base64')}`;
    }
    fail(10, `could not upload ${ref}: ${e.message}. Host the file at a public URL and pass that instead.`);
  }
}
