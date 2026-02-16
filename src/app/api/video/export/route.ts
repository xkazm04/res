import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Save the real architecture for bundling (lightningcss needs native ARM64 binary)
const realArch = process.arch;
const isArm64Windows = process.platform === 'win32' && realArch === 'arm64';

// Immediately spoof x64 at module load — Remotion's compositor only ships x64
// binaries on Windows, but they run fine under ARM64's WoW64 emulation layer.
// The only step that needs real ARM64 is lightningcss during CSS bundling.
if (isArm64Windows) {
  Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true });
}

/** Ensure process.arch reads 'x64' for Remotion compositor. */
function ensureX64() {
  if (isArm64Windows && process.arch !== 'x64') {
    Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true });
  }
}

// Cache the bundle location between requests
let cachedBundleLocation: string | null = null;

async function ensureBundle(): Promise<string> {
  if (cachedBundleLocation) {
    try {
      if (fs.existsSync(cachedBundleLocation)) {
        return cachedBundleLocation;
      }
    } catch { /* bundle was cleaned up, recreate */ }
  }

  console.log('[export] Bundling Remotion project...');
  const startTime = Date.now();

  // Temporarily restore real ARM64 arch for bundling
  // (lightningcss + @tailwindcss/postcss need native ARM64 binaries)
  if (isArm64Windows) {
    Object.defineProperty(process, 'arch', { value: realArch, writable: true, configurable: true });
  }

  try {
    const { bundle } = await import('@remotion/bundler');

    cachedBundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), 'src/remotion/entry.tsx'),
      webpackOverride: (currentConfig) => {
        const nonCssRules = currentConfig.module?.rules?.filter(rule => {
          if (rule && typeof rule === 'object' && 'test' in rule) {
            return !String(rule.test).includes('css');
          }
          return true;
        }) || [];

        return {
          ...currentConfig,
          // Disable webpack filesystem cache to prevent stale arch-specific
          // native binary resolutions (lightningcss ARM64 vs x64)
          cache: false,
          module: {
            ...currentConfig.module,
            rules: [
              ...nonCssRules,
              {
                test: /\.css$/i,
                use: [
                  'style-loader',
                  {
                    loader: 'css-loader',
                    options: { importLoaders: 1 },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      postcssOptions: {
                        plugins: [['@tailwindcss/postcss', {}]],
                      },
                    },
                  },
                ],
              },
            ],
          },
          resolve: {
            ...currentConfig.resolve,
            alias: {
              ...currentConfig.resolve?.alias,
              '@': process.cwd(),
            },
          },
        };
      },
    });

    console.log(`[export] Bundle ready in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    return cachedBundleLocation;
  } finally {
    // Always restore x64 after bundling, even on error
    ensureX64();
  }
}

/**
 * POST /api/video/export
 *
 * Server-side video rendering using @remotion/renderer.
 * Renders the composition with headless Chrome and returns the MP4 file.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { compositionId, inputProps } = body;

    if (!compositionId) {
      return NextResponse.json({ error: 'compositionId is required' }, { status: 400 });
    }

    // Step 1: Bundle (temporarily uses real ARM64 arch for lightningcss)
    console.log('[export] Starting render for', compositionId);
    const serveUrl = await ensureBundle();

    // Step 2: Import renderer (arch is already x64 from ensureBundle's finally block)
    ensureX64(); // Defensive: re-assert in case concurrent request toggled arch
    const { selectComposition, renderMedia } = await import('@remotion/renderer');

    console.log('[export] Selecting composition...');
    ensureX64(); // Re-assert before compositor call
    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps: inputProps || {},
    });

    console.log(
      `[export] Rendering: ${composition.durationInFrames} frames at ${composition.fps}fps ` +
      `(${composition.width}x${composition.height})`
    );

    // Step 3: Render to temp file
    const outputPath = path.join(os.tmpdir(), `remotion-export-${Date.now()}.mp4`);

    ensureX64(); // Re-assert before render
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: inputProps || {},
      imageFormat: 'jpeg',
      jpegQuality: 90,
      scale: 2.4, // 960×540 design viewport × 2.4 = 2304×1296 QHD output
      timeoutInMilliseconds: 120000, // 2min per frame for slow remote assets
      onProgress: ({ renderedFrames, progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 10 === 0 || renderedFrames <= 1) {
          console.log(`[export] Progress: ${pct}% (${renderedFrames} frames)`);
        }
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[export] Render complete in ${elapsed}s`);

    // Step 4: Read and return the video file
    const fileBuffer = fs.readFileSync(outputPath);
    try { fs.unlinkSync(outputPath); } catch { /* ignore cleanup errors */ }

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(fileBuffer.length),
        'Content-Disposition': `attachment; filename="export-${Date.now()}.mp4"`,
      },
    });
  } catch (error) {
    ensureX64(); // Ensure x64 is restored on error
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[export] Error after ${elapsed}s:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 },
    );
  }
}

export const maxDuration = 300;
