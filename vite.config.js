import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import path from 'path';
import external from 'rollup-plugin-peer-deps-external';
import { defineConfig, transformWithEsbuild } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageInfo from './package.json';

export default defineConfig(() => {
  return {
    define: {
      'process.env': JSON.stringify({ NODE_DEBUG: false }),
      'process.versions': JSON.stringify({ node: packageInfo.volta.node }),
    },

    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src'),
        },
      ],
    },

    build: {
      outDir: 'build',
      rollupOptions: {
        input: {
          app: './index.html',
        },
      },
      target: 'es2020',
    },

    plugins: [
      react(),
      nodePolyfills({
        include: ['crypto', 'events'],
      }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        exclude: '/**/node_modules/**',
        extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
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
      external({
        includeDependencies: true,
      }),
      commonjs(),
    ],

    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
        loader: {
          '.js': 'jsx',
        },
      },
      include: ['regenerator-runtime/runtime'],
    },
  };
});
