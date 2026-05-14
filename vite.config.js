import babel from '@rollup/plugin-babel';
import react from '@vitejs/plugin-react';
import { cpSync, readFileSync, rmSync, statSync } from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageInfo from './package.json';

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.html': 'text/html'
};

function serveMonacoEditorPlugin() {
  const monacoRoot = path.resolve(__dirname, 'node_modules/monaco-editor');

  return {
    name: 'serve-monaco-editor',
    configureServer(server) {
      server.middlewares.use('/monaco-editor', (req, res, next) => {
        const filePath = path.join(monacoRoot, (req.url || '/').replace(/\?.*$/, ''));
        try {
          if (!statSync(filePath).isFile()) return next();
          res.setHeader('Content-Type', MIME_TYPES[path.extname(filePath)] || 'application/octet-stream');
          res.end(readFileSync(filePath));
        } catch {
          next();
        }
      });
    },
    writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'build');
      const target = path.join(outDir, 'monaco-editor');

      rmSync(target, { force: true, recursive: true });
      cpSync(path.join(monacoRoot, 'min/vs'), path.join(target, 'min/vs'), { recursive: true });
    }
  };
}

const needEnvSettings = [
  'ECOS_PAGE_TITLE',
  'SHARE_PROXY_URL',
  'NODE_ENV',
  'PUBLIC_URL',
  'RELEASE_VERSION',
  'PORT',
  'REACT_APP_KEYCLOAK_CONFIG_REALM_ID',
  'REACT_APP_KEYCLOAK_CONFIG_CLIENT_ID',
  'REACT_APP_KEYCLOAK_CONFIG_EIS_ID'
];

const preOptimizeDepsLibs = [
  'react-placeholder',
  'react-placeholder/lib/placeholders',
  'lodash/isNull',
  'lodash/isArrayLike',
  'regenerator-runtime',
  'moment/dist/locale/ru',
  'moment/dist/locale/en-gb',
  'flatpickr/dist/l10n/ru.js',
  'date-fns/locale/en-GB',
  'date-fns/locale/ru',
  'bpmn-js/lib/features/palette/PaletteProvider',
  'formiojs/components/Validator',
  'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider',
  'bpmn-js/lib/features/popup-menu/util/TypeUtil',
  'bpmn-js/lib/features/replace/ReplaceOptions',
  'dmn-js-drd/lib/Viewer',
  'dmn-js-shared/lib/util/CompatibilityUtils',
  'min-dom',
  'bpmn-js/lib/features/modeling/Modeling',
  'bpmn-js-color-picker/colors/ColorContextPadProvider',
  'dmn-js-drd/lib/features/modeling/Modeling',
  'bpmn-js/lib/features/keyboard/BpmnKeyboardBindings',
  'diagram-js/lib/features/keyboard/Keyboard',
  'bpmn-js/lib/features/label-editing/LabelEditingProvider',
  'diagram-js/lib/features/selection/Selection',
  'bpmn-js/lib/features/modeling/cmd/UpdatePropertiesHandler',
  'formiojs/Component',
  'tippy.js',
  'dmn-js-drd/lib/features/modeling/cmd/UpdatePropertiesHandler',
  'diagram-js/lib/command/CommandStack',
  'bpmn-js/lib/features/context-pad/ContextPadProvider',
  'formiojs/EventEmitter',
  'formiojs/Webform',
  'formiojs/WebformBuilder',
  'formiojs/utils/builder',
  'keycloak-js',
  'bpmn-js-color-picker',
  'formiojs',
  'dmn-js-drd',
  'react-router',
  'ace-builds/src-noconflict/mode-html',
  'ace-builds/src-noconflict/theme-monokai',
  'lodash/uniq',
  'regenerator-runtime/runtime',
  '@lexical/react/LexicalCollaborationContext',
  '@lexical/react/LexicalNestedComposer',
  'lodash/noop',
  'bpmn-js/lib/features/modeling/ElementFactory',
  'react-xml-viewer',
  'cmmn-js/lib/features/modeling/util/ModelingUtil',
  'camunda-dmn-js',
  'dmn-js-drd/lib/NavigatedViewer',
  'dmn-js-shared/lib/util/ModelUtil',
  'react-select/async',
  'dompurify',
  'chart.js',
  'react-chartjs-2',
  'chartjs-plugin-datalabels',
  'vite-plugin-node-polyfills/shims/buffer',
  'vite-plugin-node-polyfills/shims/global',
  'vite-plugin-node-polyfills/shims/process',
  'events',
  'tooltip.js'
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      hmr: {
        overlay: false
      }
    },
    define: {
      'process.env': JSON.stringify({
        NODE_DEBUG: false,
        ...needEnvSettings.reduce((acc, key) => ({ ...acc, [key]: env[key] }), {})
      }),
      'process.versions': JSON.stringify({ node: packageInfo.volta.node }),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    build: {
      outDir: 'build',
      sourcemap: mode !== 'production',
      minify: 'terser',
      chunkSizeWarningLimit: 1500,
      terserOptions: {
        keep_classnames: true,
        parse: {
          ecma: 2020
        },
        compress: {
          ecma: 2020,
          comparisons: false,
          inline: 2,
          /** Attention! Don't forget to remove the 'debugger' from the codebase if you don't need it! **/
          drop_debugger: false // for debug on stand
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 2020,
          comments: false,
          ascii_only: true
        }
      },
      rollupOptions: {
        output: {
          sourcemapPathTransform: relativeSourcePath => {
            return path.relative('src', relativeSourcePath).replace(/\\/g, '/');
          },
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (/[\\/]node_modules[\\/](lexical|@lexical|@excalidraw)[\\/]/.test(id)) {
              return 'vendor-lexical';
            }
            if (
              /[\\/]node_modules[\\/](bpmn-js|dmn-js|cmmn-js|diagram-js|camunda-dmn-js|bpmn-js-bpmnlint|bpmn-js-color-picker|dmn-js-properties-panel|dmn-js-drd|dmn-js-shared|dmn-js-decision-table|dmn-js-literal-expression|bpmn-moddle|dmn-moddle|cmmn-moddle|camunda-dmn-moddle|@bpmn-io|bpmn-font|cmmn-font|bpmnlint|bpmnlint-utils|min-dom|min-dash|tiny-svg|didi|moddle|moddle-xml|ids|object-refs|saxen|inherits-browser|hammerjs|preact|htm|@codemirror|@lezer|crelt|style-mod|w3c-keyname)[\\/]/.test(
                id
              )
            ) {
              return 'vendor-bpmn';
            }
            if (/[\\/]node_modules[\\/](formiojs|@formio)[\\/]/.test(id)) {
              return 'vendor-formio';
            }
            if (/[\\/]node_modules[\\/](pdfjs-dist|react-xml-viewer|react-diff-viewer-continued)[\\/]/.test(id)) {
              return 'vendor-pdf';
            }
            if (/[\\/]node_modules[\\/](yjs|y-websocket|y-protocols|lib0)[\\/]/.test(id)) {
              return 'vendor-collab';
            }
            if (/[\\/]node_modules[\\/]keycloak-js[\\/]/.test(id)) {
              return 'vendor-auth';
            }
          }
        },
        input: {
          main: new URL('./index.html', import.meta.url).pathname
        },
        onwarn(warning, warn) {
          if (warning.code === 'EVAL' && warning.id && /[\\/]node_modules[\\/]@excalidraw\/excalidraw[\\/]/.test(warning.id)) {
            return;
          }
          warn(warning);
        }
      },
      target: 'es2020'
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        }
      ]
    },
    plugins: [
      react(),
      serveMonacoEditorPlugin(),
      nodePolyfills({
        include: ['events']
      }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.vite[\\/]/],
        extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
        plugins: ['@babel/plugin-transform-flow-strip-types'],
        presets: [['@babel/preset-react', { runtime: 'automatic' }]]
      }),
      tsconfigPaths()
    ],
    optimizeDeps: {
      include: preOptimizeDepsLibs,
      esbuildOptions: {
        target: 'es2020'
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          quietDeps: true,
          silenceDeprecations: ['global-builtin', 'color-functions', 'import'] // TODO: transfer all @import to @use
        }
      }
    }
  };
});
