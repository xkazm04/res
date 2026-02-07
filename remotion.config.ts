/**
 * Remotion Configuration
 *
 * Configure Remotion CLI for Lambda rendering.
 * See: https://www.remotion.dev/docs/config
 */

import { Config } from '@remotion/cli/config';

// Webpack configuration for Next.js compatibility
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@': process.cwd(),
      },
    },
  };
});

// Set the entry point for compositions
Config.setEntryPoint('./src/remotion/entry.tsx');
