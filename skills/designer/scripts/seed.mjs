#!/usr/bin/env node
// Prints a long random alphanumeric string from the OS entropy source and, with --rolls,
// the creative-direction "dice rolls" derived from it. Randomness has to come from outside
// the model: a model asked to "imagine" a random string produces the same few strings every
// time, and a model asked to do modular arithmetic on 96 characters gets it wrong. This script
// does both parts deterministically. See references/directions.md for how to read the rolls.
//
// Usage: node seed.mjs [--rolls] [--neighbors 2] [--length 96] [--count 1] [--json]
//   --rolls      also print the axis rolls for the string
//   --neighbors  print N variants that keep the rolls but change one or two axes (for "nearby" directions)
import crypto from 'node:crypto';
import { parseArgs, printJson } from './lib.mjs';

const AXES = [
  ['era', ['ancient or classical', 'medieval or manuscript', 'industrial 1900s', 'mid-century modern', '1970s-80s analog', '1990s-Y2K digital', 'present-day craft', 'speculative future']],
  ['material', ['paper or print', 'metal, machined', 'glass or liquid', 'stone or concrete', 'wood and joinery', 'textile and thread', 'pixels and CRT', 'ink and wet media', 'ceramic and glaze', 'light and neon']],
  ['color', ['monochrome plus one accent', 'warm earth', 'cool mineral', 'saturated and clashing', 'pastel and chalky']],
  ['type', ['grotesk', 'serif editorial', 'monospace or technical', 'display at extreme scale', 'humanist sans', 'handwritten or stencil', 'blackletter or unusual revival']],
  ['layout', ['strict modular grid', 'editorial columns with breaks', 'radical asymmetry', 'single fixed viewport, no scroll', 'stacked full-bleed panels', 'radial or centered object', 'table, ledger or document', 'map or spatial canvas']],
  ['motion', ['none, everything static', 'mechanical and stepped', 'organic and slow', 'glitchy and abrupt', 'cinematic camera moves', 'physics: things fall and settle']],
  ['imagery', ['photography', 'illustration', '3D render', 'generative or abstract', 'typography only', 'diagrams and instruments', 'collage']],
  ['density', ['sparse, one thing per screen', 'airy editorial', 'dense and busy', 'maximal, deliberately overwhelming']],
  ['wildcard', ['only one typeface', 'no rectangles', 'everything is a list', 'the page is one object', 'the cursor changes the world', 'sound has a role', 'one color only', 'no images, only type and rules', 'landscape only', 'the layout breaks at one scroll point']],
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Sum the character codes of each 4-character group; group k picks axis k with sum % options. */
function rollsFor(seed) {
  const rolls = {};
  AXES.forEach(([axis, options], k) => {
    const group = seed.slice(k * 4, k * 4 + 4) || seed.slice(0, 4);
    const sum = [...group].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const index = sum % options.length;
    rolls[axis] = { index, value: options[index] };
  });
  return rolls;
}

function neighborOf(rolls, seed, n) {
  // Change one or two axes chosen by later character groups so neighbors are also seed-derived.
  const out = JSON.parse(JSON.stringify(rolls));
  const start = AXES.length * 4 + n * 8;
  const pick = (offset, mod) => [...(seed.slice(start + offset, start + offset + 4) || randomString(4))].reduce((s, ch) => s + ch.charCodeAt(0), 0) % mod;
  const changes = 1 + pick(0, 2);
  for (let c = 0; c < changes; c++) {
    const axisIndex = pick(4 + c * 2, AXES.length);
    const [axis, options] = AXES[axisIndex];
    const shift = 1 + pick(6 + c * 2, options.length - 1);
    const index = (out[axis].index + shift) % options.length;
    out[axis] = { index, value: options[index] };
  }
  return out;
}

const args = parseArgs(process.argv.slice(2), { booleans: ['rolls', 'json'] });
const length = Math.max(48, Number(args.length || 96));
const count = Math.max(1, Number(args.count || 1));
const neighbors = Number(args.neighbors || 0);
const results = [];
for (let i = 0; i < count; i++) {
  const seed = randomString(length);
  const entry = { seed };
  if (args.rolls || neighbors || args.json) {
    entry.rolls = rollsFor(seed);
    if (neighbors) entry.neighbors = Array.from({ length: neighbors }, (_, n) => neighborOf(entry.rolls, seed, n));
  }
  results.push(entry);
}
if (args.json) { printJson(count === 1 ? results[0] : results); process.exit(0); }
for (const r of results) {
  console.log(r.seed);
  if (r.rolls) {
    for (const [axis, roll] of Object.entries(r.rolls)) console.log(`  ${axis.padEnd(9)} ${roll.index}  ${roll.value}`);
    (r.neighbors || []).forEach((nb, i) => {
      const diff = Object.entries(nb).filter(([axis, roll]) => roll.index !== r.rolls[axis].index).map(([axis, roll]) => `${axis}: ${roll.value}`);
      console.log(`  neighbor ${i + 1}: same as above except ${diff.join('; ')}`);
    });
  }
}
