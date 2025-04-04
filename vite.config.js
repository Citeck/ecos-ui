import babel from '@rollup/plugin-babel';
import path from 'path';
import { defineConfig, transformWithEsbuild, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageInfo from './package.json';

const needEnvSettings = [
  'ECOS_PAGE_TITLE',
  'SHARE_PROXY_URL',
  'NODE_ENV',
  'PUBLIC_URL',
  'RELEASE_VERSION',
  'PORT',
  'REACT_APP_KEYCLOAK_CONFIG_REALM_ID',
  'REACT_APP_KEYCLOAK_CONFIG_CLIENT_ID',
  'REACT_APP_KEYCLOAK_CONFIG_EIS_ID',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      hmr: {
        overlay: false,
      },
    },
    define: {
      'process.env': JSON.stringify({
        NODE_DEBUG: false,
        ...needEnvSettings.reduce((acc, key) => ({ ...acc, [key]: env[key] }), {}),
      }),
      'process.versions': JSON.stringify({ node: packageInfo.volta.node }),
    },
    build: {
      outDir: 'build',
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        keep_classnames: true,
        parse: {
          ecma: 2017,
        },
        compress: {
          ecma: 5,
          comparisons: false,
          inline: 2,

          /** Attention! Don't forget to remove the 'debugger' from the codebase if you don't need it! **/
          drop_debugger: false, // for debug on stand
        },
        mangle: {
          safari10: true,
        },
        output: {
          ecma: 5,
          comments: false,
          ascii_only: true,
        },
      },
      rollupOptions: {
        output: {
          sourcemapPathTransform: (relativeSourcePath) => {
            return path.relative('src', relativeSourcePath).replace(/\\/g, '/');
          },
        },
        input: {
          main: new URL('./index.html', import.meta.url).pathname,
        },
        onwarn(warning, warn) {
          if (warning.code === 'EVAL' && warning.id && /[\\/]node_modules[\\/]@excalidraw\/excalidraw[\\/]/.test(warning.id)) {
            return;
          }
          warn(warning);
        },
      },
      target: 'es2020',
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
  };
});
