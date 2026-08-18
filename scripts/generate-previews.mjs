// Headless preview generator: renders every SCENE from src/procedural.ts to a
// PNG in previews/ so the README can show real output of the library.
//
//   node scripts/generate-previews.mjs
//
// Requires Node 22.18+ (native TypeScript type stripping) — no other deps.
// The PNG encoder uses only Node's built-in zlib.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderDepthMap, renderStereogram, SCENES } from "../src/procedural.ts";

// ---- ImageData polyfill (Node has no DOM) ---------------------------------

class ImageDataPolyfill {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = ImageDataPolyfill;
}

// ---- Minimal PNG encoder (RGB, 8-bit, no interlace) ------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(imageData) {
  const { width, height, data } = imageData;
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (stride + 1) + 1 + x * 3;
      raw[di] = data[si];
      raw[di + 1] = data[si + 1];
      raw[di + 2] = data[si + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Headless stand-in for makeTextDepth (no canvas in Node) ---------------
// A tiny 5x7 bitmap font renders the "3D" text scene. The browser version uses
// the system font; this keeps previews reproducible without any DOM.

const GLYPHS = {
  "3": ["11110", "00001", "00001", "00110", "00001", "00001", "11110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
};

function makeTextDepthHeadless(text) {
  return (x, y, w, h) => {
    const len = text.length;
    const fontSize = Math.min(h * 0.55, (w / Math.max(len, 1)) * 1.7);
    const scale = Math.max(1, Math.floor(fontSize / 7));
    const startX = Math.floor((w - len * 5 * scale) / 2);
    const startY = Math.floor((h - 7 * scale) / 2);
    const col = Math.floor((x - startX) / scale);
    const row = Math.floor((y - startY) / scale);
    if (row < 0 || row >= 7 || col < 0) return 0;
    const glyph = GLYPHS[text[Math.floor(col / 5)]];
    return glyph && glyph[row][col % 5] === "1" ? 1 : 0;
  };
}

// ---- Render every scene ----------------------------------------------------

const WIDTH = 560;
const HEIGHT = 380;

mkdirSync("previews", { recursive: true });

for (const scene of SCENES) {
  const depth = scene.id === "text3d" ? makeTextDepthHeadless("3D") : scene.depth;

  const stereogram = renderStereogram({
    width: WIDTH,
    height: HEIGHT,
    depth,
    palette: scene.palette,
    seed: 1337,
  });
  writeFileSync(`previews/${scene.id}.png`, encodePng(stereogram));
  console.log(`previews/${scene.id}.png`);

  const depthMap = renderDepthMap(depth, WIDTH, HEIGHT);
  writeFileSync(`previews/${scene.id}-depth.png`, encodePng(depthMap));
  console.log(`previews/${scene.id}-depth.png`);
}
