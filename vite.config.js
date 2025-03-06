import babel from '@rollup/plugin-babel';
import path from 'path';
import { defineConfig, transformWithEsbuild } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageInfo from './package.json';

export default defineConfig(({ mode }) => ({
  define: {
    'process.env': JSON.stringify({ NODE_DEBUG: false }),
    'process.versions': JSON.stringify({ node: packageInfo.volta.node }),
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        app: './index.html',
      },
    },
    target: 'es2020',
    ...(mode === 'production' && {
      minify: 'terser',
      terserOptions: {
        compress: {
          toplevel: true,
        },
        keep_classnames: true,
      },
    }),
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  plugins: [
    nodePolyfills({
      include: ['crypto', 'events'],
    }),
    babel({
      babelHelpers: 'bundled',
      babelrc: false,
      configFile: false,
      exclude: '/**/node_modules/**',
      extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
      plugins: ['@babel/plugin-transform-flow-strip-types'],
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    }),
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    tsconfigPaths(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      loader: {
        '.js': 'jsx',
      },
    },
  },
}));
