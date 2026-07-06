import type {
  BlurDepthOptions,
  MagicEyePipelineContext,
  MagicEyeStage,
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

export function normalizeDepth(): MagicEyeStage {
  return {
    name: "normalizeDepth",
    run(context) {
      const { width, height, depthData } = context;
      const pixelCount = width * height;
      const normalized = createFloatBuffer(width, height);
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;

      for (let i = 0, p = 0; i < pixelCount; i += 1, p += 4) {
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

  return {
    name: "tiledAutostereogram",
    run(context) {
      const { width, height, patternData, outputCanvas } = context;
      const workingDepth = ensureWorkingDepth(context);
      const output = context.outputImageData;
      const patternWidth = Math.max(1, patternData.width);
      const patternHeight = Math.max(1, patternData.height);
      const patternPixels = patternData.data;
      const outputPixels = output.data;

      for (let y = 0; y < height; y += 1) {
        const patternY = y % patternHeight;
        for (let x = 0; x < width; x += 1) {
          const depthValue = clamp01(workingDepth[y * width + x] ?? 0.5);
          const phaseShift = Math.round((1 - depthValue) * eyeSeparation * depthStrength);
          const patternX = (x + phaseShift) % patternWidth;
          const sourceIndex = (patternY * patternWidth + patternX) * 4;
          const targetIndex = (y * width + x) * 4;

          outputPixels[targetIndex] = patternPixels[sourceIndex];
          outputPixels[targetIndex + 1] = patternPixels[sourceIndex + 1];
          outputPixels[targetIndex + 2] = patternPixels[sourceIndex + 2];
          outputPixels[targetIndex + 3] = patternPixels[sourceIndex + 3];
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
