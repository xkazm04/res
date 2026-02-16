import path from 'path';
import { bundle } from '@remotion/bundler';

console.log('Starting bundle...');
const start = Date.now();

try {
  const loc = await bundle({
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
  console.log('Bundle OK:', loc);
  console.log('Time:', ((Date.now() - start) / 1000).toFixed(1) + 's');
} catch (err) {
  console.error('Bundle FAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 15).join('\n'));
}
