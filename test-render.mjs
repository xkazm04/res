import path from 'path';
import fs from 'fs';
import os from 'os';

// Save real architecture
const realArch = process.arch;
const isArm64Windows = process.platform === 'win32' && realArch === 'arm64';

function setArchForBundling() {
  if (isArm64Windows) {
    Object.defineProperty(process, 'arch', { value: realArch, writable: true, configurable: true });
  }
}

function setArchForRenderer() {
  // Remotion compositor needs x64; Windows ARM64 runs x64 binaries via emulation
  if (isArm64Windows) {
    Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true });
  }
}

console.log('Platform:', process.platform, 'Real arch:', realArch);
const start = Date.now();

try {
  // Step 1: Bundle with REAL arch (lightningcss needs ARM64 native binary)
  setArchForBundling();
  console.log('Step 1: Bundling (arch:', process.arch, ')...');

  const { bundle } = await import('@remotion/bundler');

  const serveUrl = await bundle({
    entryPoint: path.resolve(process.cwd(), 'src/remotion/entry.tsx'),
    webpackOverride: (config) => {
      const nonCssRules = (config.module?.rules || []).filter(rule => {
        if (rule && typeof rule === 'object' && 'test' in rule) {
          const testStr = String(rule.test);
          if (testStr.includes('css')) return false;
        }
        return true;
      });
      return {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...nonCssRules,
            {
              test: /\.css$/i,
              use: [
                'style-loader',
                { loader: 'css-loader', options: { importLoaders: 1 } },
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
          ...config.resolve,
          alias: { ...config.resolve?.alias, '@': process.cwd() },
        },
      };
    },
  });
  console.log('Bundle OK:', serveUrl, `(${((Date.now() - start) / 1000).toFixed(1)}s)`);

  // Step 2: Switch to x64 for Remotion renderer (compositor needs x64)
  setArchForRenderer();
  console.log('Step 2: Selecting composition (arch:', process.arch, ')...');

  const { selectComposition, renderMedia } = await import('@remotion/renderer');

  const composition = await selectComposition({
    serveUrl,
    id: 'legal-video',
    inputProps: {
      templateType: 'legal',
      format: 'standard',
      videoContent: {
        title: 'Test', subtitle: '', hook: 'Test hook',
        verdict: 'Test verdict', verdictType: 'mixed',
        keyNarratives: [], warnings: [],
      },
    },
  });
  console.log('Composition:', composition.durationInFrames, 'frames @', composition.fps, 'fps');
  console.log(`(${composition.width}x${composition.height})`);

  // Render only first 2 seconds for testing
  const testFrames = Math.min(composition.fps * 2, composition.durationInFrames);
  console.log(`Step 3: Rendering ${testFrames} frames (2s test)...`);
  const outputPath = path.join(os.tmpdir(), `remotion-test-${Date.now()}.mp4`);

  await renderMedia({
    composition: { ...composition, durationInFrames: testFrames },
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: {
      templateType: 'legal',
      format: 'standard',
      videoContent: {
        title: 'Test', subtitle: '', hook: 'Test hook',
        verdict: 'Test verdict', verdictType: 'mixed',
        keyNarratives: [], warnings: [],
      },
    },
    imageFormat: 'jpeg',
    jpegQuality: 80,
    onProgress: ({ renderedFrames, progress }) => {
      process.stdout.write(`\r  Rendered ${renderedFrames}/${testFrames} frames (${Math.round(progress * 100)}%)`);
    },
  });
  console.log('\nRender OK:', outputPath);
  const stats = fs.statSync(outputPath);
  console.log('File size:', (stats.size / 1024).toFixed(0), 'KB');
  console.log('Total time:', ((Date.now() - start) / 1000).toFixed(1) + 's');

  // Restore arch
  setArchForBundling();

  fs.unlinkSync(outputPath);
  console.log('Done!');
} catch (err) {
  setArchForBundling(); // Restore on error
  console.error('\nFAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 15).join('\n'));
}
