# react-magiceye

A headless React canvas renderer for autostereograms, built around a small
shader-like pipeline.

Best mental model:

```text
pattern texture ┐
                ├─ depth processors ─ stereo stage ─ post processors ─ canvas
depth map ──────┘
```

`MagicEyeCanvas` does not include an editor or any UI chrome. It only renders to
its canvas and lets you shape the output through pipeline stages.

## Example

```tsx
import {
  MagicEyeCanvas,
  blurDepth,
  invertDepth,
  normalizeDepth,
  tiledAutostereogram,
} from "react-magiceye";

export function Demo({ patternImage, depthImage }: {
  patternImage: HTMLImageElement;
  depthImage: HTMLImageElement;
}) {
  return (
    <MagicEyeCanvas
      pattern={patternImage}
      depth={depthImage}
      width={1024}
      height={768}
      pipeline={[
        normalizeDepth(),
        blurDepth({ radius: 2 }),
        invertDepth(false),
        tiledAutostereogram({
          eyeSeparation: 96,
          depthStrength: 0.75,
        }),
      ]}
    />
  );
}
```

## Pipeline order

- `normalizeDepth()` converts the depth source into a 0–1 float buffer.
- `blurDepth({ radius })` smooths the depth map.
- `invertDepth(enabled)` flips near/far values when needed.
- `tiledAutostereogram()` turns the processed depth buffer into the final
  stereogram.

You can also pass your own custom stages if you want to insert extra processing
between any of those steps.

## Source types

`pattern` and `depth` accept:

- `HTMLImageElement`
- `HTMLCanvasElement`
- `HTMLVideoElement`
- `ImageBitmap`
- `ImageData`
- `string` URLs

## Install

```bash
git clone git@github.com:EthanThatOneKid/react-magiceye.git
cd react-magiceye
bun install
bun run typecheck
```

## Notes

- The renderer is deliberately headless.
- The canvas is the only output.
- The pipeline is deterministic, so the same pattern, depth map, and stage
  order always produce the same image.
