"use strict";

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "src", "assets");
const icoPath = path.join(outDir, "app.ico");
const svgPath = path.join(outDir, "app.svg");

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function makePixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);
  const t = clamp((x + y) / (2 * size), 0, 1);

  const r0 = 16;
  const g0 = 33;
  const b0 = 58;
  const r1 = 0;
  const g1 = 182;
  const b1 = 255;

  let rr = Math.round(lerp(r0, r1, t));
  let gg = Math.round(lerp(g0, g1, t));
  let bb = Math.round(lerp(b0, b1, t));
  let aa = 255;

  const ringOuter = size * 0.47;
  const ringInner = size * 0.32;
  if (r < ringOuter && r > ringInner) {
    rr = 200;
    gg = 244;
    bb = 255;
  }

  const barW = Math.floor(size * 0.08);
  const left = Math.floor(size * 0.23);
  const right = Math.floor(size * 0.69);
  const top = Math.floor(size * 0.24);
  const bottom = Math.floor(size * 0.76);
  if (y >= top && y <= bottom) {
    if (x >= left && x < left + barW) {
      rr = 232;
      gg = 247;
      bb = 255;
    }
    if (x >= right && x < right + barW) {
      rr = 232;
      gg = 247;
      bb = 255;
    }
  }

  const diagonal = (x - left) - (y - top);
  if (x >= left + barW && x <= right && y >= top && y <= bottom && Math.abs(diagonal) <= barW) {
    rr = 232;
    gg = 247;
    bb = 255;
  }

  const fade = clamp((r - size * 0.47) / (size * 0.03), 0, 1);
  aa = Math.round(255 * (1 - fade));
  if (r > size * 0.5) aa = 0;

  return [rr, gg, bb, aa];
}

function makeIco(size = 64) {
  const pixelData = Buffer.alloc(size * size * 4);
  let p = 0;

  for (let y = size - 1; y >= 0; y -= 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = makePixel(x, y, size);
      pixelData[p++] = b;
      pixelData[p++] = g;
      pixelData[p++] = r;
      pixelData[p++] = a;
    }
  }

  const maskRowBytes = Math.ceil(size / 32) * 4;
  const maskData = Buffer.alloc(maskRowBytes * size, 0x00);

  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(pixelData.length + maskData.length, 20);
  header.writeInt32LE(0, 24);
  header.writeInt32LE(0, 28);
  header.writeUInt32LE(0, 32);
  header.writeUInt32LE(0, 36);

  const imageData = Buffer.concat([header, pixelData, maskData]);

  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2);
  iconDir.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(imageData.length, 8);
  entry.writeUInt32LE(6 + 16, 12);

  return Buffer.concat([iconDir, entry, imageData]);
}

function makeSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#10213a"/>
      <stop offset="100%" stop-color="#00b6ff"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="248" fill="url(#g)"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="#c8f4ff" stroke-width="30"/>
  <path d="M120 120h44v272h-44zM348 120h44v272h-44zM168 120h50l126 272h-50z" fill="#e8f7ff"/>
</svg>`;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(icoPath, makeIco(256));
  fs.writeFileSync(svgPath, makeSvg(), "utf8");
  process.stdout.write(`Generated ${icoPath}\nGenerated ${svgPath}\n`);
}

main();
