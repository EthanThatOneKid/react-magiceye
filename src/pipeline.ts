import type {
  BlurDepthOptions,
  ClassicStereogramOptions,
  MagicEyePipelineContext,
  MagicEyeStage,
  ThimblebyStereogramOptions,
  TiledAutostereogramOptions,
} from "./types";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function createFloatBuffer(width: number, height: number, fill = 0): Float32Array {
  const buffer = new Float32Array(width * height);
  if (fill !== 0) {
    buffer.fill(fill);
  }
  return buffer;
}

function copyBuffer(buffer: Float32Array): Float32Array {
  return new Float32Array(buffer);
}

function luminanceFromImageData(data: Uint8ClampedArray, index: number): number {
  return (
    0.2126 * data[index] +
    0.7152 * data[index + 1] +
    0.0722 * data[index + 2]
  ) / 255;
}

function boxBlur(
  source: Float32Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  if (radius <= 0) {
    return copyBuffer(source);
  }

  const horizontal = createFloatBuffer(width, height);
  const output = createFloatBuffer(width, height);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      const clampedX = Math.min(width - 1, Math.max(0, x));
      sum += source[y * width + clampedX];
    }

    for (let x = 0; x < width; x += 1) {
      horizontal[y * width + x] = sum / windowSize;

      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      sum += source[y * width + addX] - source[y * width + removeX];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      const clampedY = Math.min(height - 1, Math.max(0, y));
      sum += horizontal[clampedY * width + x];
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / windowSize;

      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      sum += horizontal[addY * width + x] - horizontal[removeY * width + x];
    }
  }

  return output;
}

function ensureWorkingDepth(context: MagicEyePipelineContext): Float32Array {
  if (context.workingDepth.length !== context.width * context.height) {
    context.workingDepth = createFloatBuffer(context.width, context.height);
  }
  return context.workingDepth;
}

function sampleBilinear(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  fx: number,
  fy: number,
): [number, number, number, number] {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(fx)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(fy)));
  const y1 = Math.min(height - 1, y0 + 1);
  const wx = fx - x0;
  const wy = fy - y0;

  const i00 = (y0 * width + x0) * 4;
  const i01 = (y0 * width + x1) * 4;
  const i10 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;

  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const a = pixels[i00 + c] * (1 - wx) + pixels[i01 + c] * wx;
    const b = pixels[i10 + c] * (1 - wx) + pixels[i11 + c] * wx;
    out[c] = Math.round(a * (1 - wy) + b * wy);
  }
  return out;
}

function writePixel(
  output: Uint8ClampedArray,
  targetIndex: number,
  pixel: [number, number, number, number],
): void {
  output[targetIndex] = pixel[0];
  output[targetIndex + 1] = pixel[1];
  output[targetIndex + 2] = pixel[2];
  output[targetIndex + 3] = pixel[3];
}

function getOutputPixel(
  output: Uint8ClampedArray,
  width: number,
  y: number,
  x: number,
): [number, number, number, number] {
  const i = (y * width + x) * 4;
  return [output[i], output[i + 1], output[i + 2], output[i + 3]];
}

function computeSeparationFloat(depthValue: number, eyeSeparation: number, depthStrength: number): number {
  // A standard max depth shift is 15-20% of eyeSeparation.
  // This ensures the 3D effect is easily viewable and does not strain eyes.
  const maxShift = eyeSeparation * depthStrength * 0.15;
  return eyeSeparation - depthValue * maxShift;
}

export function normalizeDepth(): MagicEyeStage {
  return {
    name: "normalizeDepth",
    run(context) {
      const { width, height, depthData } = context;
      const pixelCount = width * height;
      const normalized = createFloatBuffer(width, height);
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;

      for (let i = 0; i < pixelCount; i += 1) {
        const x = i % width;
        const y = Math.floor(i / width);
        const sourceX = Math.min(depthData.width - 1, Math.floor((x / width) * depthData.width));
        const sourceY = Math.min(depthData.height - 1, Math.floor((y / height) * depthData.height));
        const p = (sourceY * depthData.width + sourceX) * 4;
        const value = luminanceFromImageData(depthData.data, p);
        normalized[i] = value;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }

      const range = max - min;
      if (range < 1e-6) {
        normalized.fill(0.5);
      } else {
        for (let i = 0; i < pixelCount; i += 1) {
          normalized[i] = clamp01((normalized[i] - min) / range);
        }
      }

      context.normalizedDepth = normalized;
      context.workingDepth = copyBuffer(normalized);
    },
  };
}

export function blurDepth(options: BlurDepthOptions = {}): MagicEyeStage {
  const radius = Math.max(0, Math.floor(options.radius ?? 0));

  return {
    name: "blurDepth",
    run(context) {
      if (radius <= 0) {
        return;
      }

      const workingDepth = ensureWorkingDepth(context);
      context.workingDepth = boxBlur(workingDepth, context.width, context.height, radius);
    },
  };
}

export function invertDepth(enabled = true): MagicEyeStage {
  return {
    name: "invertDepth",
    run(context) {
      if (!enabled) {
        return;
      }

      const workingDepth = ensureWorkingDepth(context);
      for (let i = 0; i < workingDepth.length; i += 1) {
        workingDepth[i] = 1 - workingDepth[i];
      }
    },
  };
}

export function tiledAutostereogram(
  options: TiledAutostereogramOptions = {},
): MagicEyeStage {
  const eyeSeparation = Math.max(1, options.eyeSeparation ?? 96);
  const depthStrength = Math.max(0, options.depthStrength ?? 0.75);
  const patternRepeatWidth = options.patternRepeatWidth != null ? Math.max(1, options.patternRepeatWidth) : null;
  const subpixel = options.subpixel ?? false;

  return {
    name: "tiledAutostereogram",
    run(context) {
      const { width, height, patternData, outputCanvas } = context;
      const workingDepth = ensureWorkingDepth(context);
      const output = context.outputImageData;
      const patternWidth = patternRepeatWidth ?? Math.max(1, patternData.width);
      const patternHeight = Math.max(1, patternData.height);
      const patternPixels = patternData.data;
      const outputPixels = output.data;

      for (let y = 0; y < height; y += 1) {
        const rowStart = y * width;

        for (let x = 0; x < width; x += 1) {
          const depthValue = clamp01(workingDepth[rowStart + x] ?? 0.5);
          const sep = computeSeparationFloat(depthValue, eyeSeparation, depthStrength);
          const di = (rowStart + x) * 4;

          if (x < sep) {
            // Fill with pattern
            const patternX = x % patternWidth;
            const patternY = y % patternHeight;
            const si = (patternY * patternWidth + patternX) * 4;
            outputPixels[di] = patternPixels[si];
            outputPixels[di + 1] = patternPixels[si + 1];
            outputPixels[di + 2] = patternPixels[si + 2];
            outputPixels[di + 3] = patternPixels[si + 3];
          } else {
            // Copy/propagate from left partner
            const srcX = x - sep;
            if (subpixel) {
              const pixel = sampleBilinear(outputPixels, width, height, srcX, y);
              writePixel(outputPixels, di, pixel);
            } else {
              const sx = Math.max(0, Math.min(width - 1, Math.round(srcX)));
              const si = (rowStart + sx) * 4;
              outputPixels[di] = outputPixels[si];
              outputPixels[di + 1] = outputPixels[si + 1];
              outputPixels[di + 2] = outputPixels[si + 2];
              outputPixels[di + 3] = outputPixels[si + 3];
            }
          }
        }
      }

      const outputCtx = outputCanvas.getContext("2d");
      if (outputCtx) {
        outputCtx.putImageData(output, 0, 0);
      }
    },
  };
}

export function classicStereogram(
  options: ClassicStereogramOptions = {},
): MagicEyeStage {
  const eyeSeparation = Math.max(1, options.eyeSeparation ?? 96);
  const depthStrength = Math.max(0, options.depthStrength ?? 0.75);
  const patternRepeatWidth = options.patternRepeatWidth != null ? Math.max(1, options.patternRepeatWidth) : null;
  const subpixel = options.subpixel ?? false;

  return {
    name: "classicStereogram",
    run(context) {
      const { width, height, patternData, outputCanvas } = context;
      const workingDepth = ensureWorkingDepth(context);
      const output = context.outputImageData;
      const patternWidth = patternRepeatWidth ?? Math.max(1, patternData.width);
      const patternHeight = Math.max(1, patternData.height);
      const patternPixels = patternData.data;
      const outputPixels = output.data;

      for (let y = 0; y < height; y += 1) {
        const rowStart = y * width;

        for (let x = 0; x < width; x += 1) {
          const patternX = x % patternWidth;
          const patternY = y % patternHeight;
          const si = (patternY * patternWidth + patternX) * 4;
          const di = (rowStart + x) * 4;
          outputPixels[di] = patternPixels[si];
          outputPixels[di + 1] = patternPixels[si + 1];
          outputPixels[di + 2] = patternPixels[si + 2];
          outputPixels[di + 3] = patternPixels[si + 3];
        }

        for (let x = 0; x < width; x += 1) {
          const depthValue = clamp01(workingDepth[rowStart + x] ?? 0.5);
          const sep = computeSeparationFloat(depthValue, eyeSeparation, depthStrength);

          if (x >= sep) {
            const srcX = x - sep;
            const di = (rowStart + x) * 4;
            if (subpixel) {
              const pixel = sampleBilinear(outputPixels, width, height, srcX, y);
              writePixel(outputPixels, di, pixel);
            } else {
              const sx = Math.max(0, Math.min(width - 1, Math.round(srcX)));
              const si = (rowStart + sx) * 4;
              outputPixels[di] = outputPixels[si];
              outputPixels[di + 1] = outputPixels[si + 1];
              outputPixels[di + 2] = outputPixels[si + 2];
              outputPixels[di + 3] = outputPixels[si + 3];
            }
          }
        }
      }

      const outputCtx = outputCanvas.getContext("2d");
      if (outputCtx) {
        outputCtx.putImageData(output, 0, 0);
      }
    },
  };
}

export function thimblebyStereogram(
  options: ThimblebyStereogramOptions = {},
): MagicEyeStage {
  const eyeSeparation = Math.max(1, options.eyeSeparation ?? 96);
  const depthStrength = Math.max(0, options.depthStrength ?? 0.75);
  const patternRepeatWidth = options.patternRepeatWidth != null ? Math.max(1, options.patternRepeatWidth) : null;
  const occlude = options.occlude ?? true;

  return {
    name: "thimblebyStereogram",
    run(context) {
      const { width, height, patternData, outputCanvas } = context;
      const workingDepth = ensureWorkingDepth(context);
      const output = context.outputImageData;
      const patternWidth = patternRepeatWidth ?? Math.max(1, patternData.width);
      const patternHeight = Math.max(1, patternData.height);
      const patternPixels = patternData.data;
      const outputPixels = output.data;

      const lookL = new Int32Array(width);
      const lookR = new Int32Array(width);

      for (let y = 0; y < height; y += 1) {
        const rowStart = y * width;

        for (let x = 0; x < width; x++) {
          lookL[x] = x;
          lookR[x] = x;
        }

        for (let x = 0; x < width; x++) {
          const depthValue = clamp01(workingDepth[rowStart + x] ?? 0.5);
          const sep = Math.round(computeSeparationFloat(depthValue, eyeSeparation, depthStrength));
          const left = Math.floor(x - sep / 2);
          const right = left + sep;

          if (left >= 0 && right < width) {
            let vis = true;

            if (occlude) {
              if (lookL[right] !== right) {
                if (lookL[right] < left) {
                  lookR[lookL[right]] = lookL[right];
                  lookL[right] = right;
                } else {
                  vis = false;
                }
              }

              if (lookR[left] !== left) {
                if (lookR[left] > right) {
                  lookL[lookR[left]] = lookR[left];
                  lookR[left] = left;
                } else {
                  vis = false;
                }
              }
            }

            if (vis) {
              lookL[right] = left;
              lookR[left] = right;
            }
          }
        }

        for (let x = 0; x < width; x++) {
          const di = (rowStart + x) * 4;
          if (lookL[x] === x) {
            const patternX = x % patternWidth;
            const patternY = y % patternHeight;
            const si = (patternY * patternWidth + patternX) * 4;
            outputPixels[di] = patternPixels[si];
            outputPixels[di + 1] = patternPixels[si + 1];
            outputPixels[di + 2] = patternPixels[si + 2];
            outputPixels[di + 3] = patternPixels[si + 3];
          } else {
            const srcIdx = lookL[x];
            const si = (rowStart + srcIdx) * 4;
            outputPixels[di] = outputPixels[si];
            outputPixels[di + 1] = outputPixels[si + 1];
            outputPixels[di + 2] = outputPixels[si + 2];
            outputPixels[di + 3] = outputPixels[si + 3];
          }
        }
      }

      const outputCtx = outputCanvas.getContext("2d");
      if (outputCtx) {
        outputCtx.putImageData(output, 0, 0);
      }
    },
  };
}

export function createDefaultPipeline(): MagicEyeStage[] {
  return [
    normalizeDepth(),
    blurDepth({ radius: 2 }),
    invertDepth(false),
    tiledAutostereogram({ eyeSeparation: 96, depthStrength: 0.75 }),
  ];
}
