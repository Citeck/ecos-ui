import babel from '@rollup/plugin-babel';
import react from '@vitejs/plugin-react';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, watch as fsWatch, writeFileSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageInfo from './package.json';
import { loadComponentAllowlist } from './vite-plugins/camelCatalogAllowlist.js';

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

function serveExcalidrawAssetsPlugin() {
  const assetsRoot = path.resolve(__dirname, 'node_modules/@excalidraw/excalidraw/dist/excalidraw-assets');

  return {
    name: 'serve-excalidraw-assets',
    configureServer(server) {
      server.middlewares.use('/excalidraw-assets', (req, res, next) => {
        const filePath = path.join(assetsRoot, (req.url || '/').replace(/\?.*$/, ''));
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
      const target = path.join(outDir, 'excalidraw-assets');

      rmSync(target, { force: true, recursive: true });
      cpSync(assetsRoot, target, { recursive: true });
    }
  };
}

// Serves @kaoto/camel-catalog at the URL /camel-catalog/* (see docs/kaoto-integration-plan.md, §3.0.1).
// In dev it is a middleware, in production a copy in build/camel-catalog/.
//
// The sanitizer does 3 things before serving the catalog JSON files:
//
// 1. `type: "enum"` → `type: "string"` (Camel-specific, not valid JSON Schema). AJV in
//    @kaoto/forms fails at compile time; the values are right there in `enum: [...]`, so the
//    string conversion is safe.
//
// 2. `$ref: "#/items/definitions/<X>"` → `$ref: "#/definitions/<X>"` (the format expected by
//    AJV/`@kaoto/forms` `resolve-schema-with-ref.js`). The Camel YAML DSL schema keeps definitions
//    in `items.definitions` to match the JSON Schema wrapper `{type: array, items: {...}}`,
//    but the KaotoForm validator cannot resolve refs inside `items`. See plan §-0.4.
//
// 3. Root-level alias `definitions = items.definitions` (when items.definitions exists and
//    definitions is absent) — so the rewritten refs actually point somewhere.
//
// NB: AJV warnings `unknown format "X" ignored` (`bean:*`, `expression`, `errorHandlerType`,
// `dataFormatType`, `loadBalancerType`) are tolerable noise:
//   - `bean:<class>` is a backend hint that the field value must be the id of a registered
//     Spring/Camel bean of the given Java class. KaotoForm does not use it yet, but the hint is
//     needed for a future bean-picker (see plan "After MVP" §8b).
//   - `expression`/`expressionProperty`/`errorHandlerType`/`dataFormatType`/`loadBalancerType`
//     are read by KaotoForm `OneOfField.js` to render the OneOf-picker title.
function sanitizeCatalogJsonInPlace(node) {
  if (Array.isArray(node)) {
    for (const v of node) sanitizeCatalogJsonInPlace(v);
  } else if (node && typeof node === 'object') {
    if (node.type === 'enum') node.type = 'string';
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/items/definitions/')) {
      node.$ref = '#/definitions/' + node.$ref.slice('#/items/definitions/'.length);
    }
    for (const k of Object.keys(node)) sanitizeCatalogJsonInPlace(node[k]);
  }
}

function liftItemsDefinitions(node) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    if (node.items && typeof node.items === 'object' && node.items.definitions && !node.definitions) {
      node.definitions = node.items.definitions;
    }
  }
}

// Runtime catalog cache: path to a runtime (camel-main/4.14.2/...) → definitions from camelYamlDsl-*.json.
// Holds a shared dictionary so that when injecting into propertiesSchema we make a shallow copy of only the
// needed definitions (instead of replicating all 1500 for each component).
const runtimeDefinitionsCache = new Map();

function getRuntimeDir(filePath) {
  const m = filePath.match(/^(.*?camel-(?:main|quarkus|springboot)[\\/][^\\/]+)[\\/]/);
  return m ? m[1] : null;
}

function loadRuntimeDefinitions(filePath) {
  const runtimeDir = getRuntimeDir(filePath);
  if (!runtimeDir) return null;
  if (runtimeDefinitionsCache.has(runtimeDir)) return runtimeDefinitionsCache.get(runtimeDir);

  let dslFile = null;
  try {
    dslFile = readdirSync(runtimeDir).find(f => /^camelYamlDsl-/.test(f));
  } catch {
    runtimeDefinitionsCache.set(runtimeDir, null);
    return null;
  }
  if (!dslFile) {
    runtimeDefinitionsCache.set(runtimeDir, null);
    return null;
  }
  try {
    const dslPath = path.join(runtimeDir, dslFile);
    const parsed = JSON.parse(readFileSync(dslPath, 'utf-8'));
    sanitizeCatalogJsonInPlace(parsed);
    liftItemsDefinitions(parsed);
    const defs = parsed.definitions || (parsed.items && parsed.items.definitions) || null;
    runtimeDefinitionsCache.set(runtimeDir, defs);
    return defs;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[serve-camel-catalog] failed to load runtime definitions:', e.message);
    runtimeDefinitionsCache.set(runtimeDir, null);
    return null;
  }
}

function collectLocalRefs(node, into) {
  if (Array.isArray(node)) {
    for (const v of node) collectLocalRefs(v, into);
  } else if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/definitions/')) {
      into.add(node.$ref.slice('#/definitions/'.length));
    }
    for (const k of Object.keys(node)) collectLocalRefs(node[k], into);
  }
}

// For each propertiesSchema found in the tree, collect the used $refs
// (including transitive ones) and add the missing definitions from runtimeDefinitions.
// This fixes the MissingRefError for DSL nodes (route, from, ...) whose propertiesSchema
// references types like `OutputAwareFromDefinition` that are not present in the local
// `propertiesSchema.definitions`.
function injectMissingDefinitionsIntoPropertiesSchemas(parsed, allDefs) {
  if (!allDefs) return;

  function injectInto(schema) {
    if (!schema || typeof schema !== 'object') return;
    const local = schema.definitions || {};
    const needed = new Set();
    collectLocalRefs(schema, needed);
    // Local definitions may themselves reference non-local types — the transitive walk must
    // descend into them too. Otherwise we would miss OutputAware and similar "deep" dependencies.
    for (const k of Object.keys(local)) needed.add(k);
    if (needed.size === 0) return;

    const toProcess = [...needed];
    const visited = new Set();
    while (toProcess.length) {
      const name = toProcess.pop();
      if (visited.has(name)) continue;
      visited.add(name);
      const def = local[name] || allDefs[name];
      if (!def) continue;
      const sub = new Set();
      collectLocalRefs(def, sub);
      for (const r of sub) {
        if (!needed.has(r)) {
          needed.add(r);
          toProcess.push(r);
        }
      }
    }

    let out = local;
    let added = false;
    for (const name of needed) {
      if (out[name]) continue;
      const def = allDefs[name];
      if (!def) continue;
      if (!added) {
        out = { ...local }; // copy-on-first-write to avoid mutating shared cached defs
        added = true;
      }
      out[name] = def;
    }
    if (added) schema.definitions = out;
  }

  function walk(node) {
    if (Array.isArray(node)) {
      for (const v of node) walk(v);
    } else if (node && typeof node === 'object') {
      if (node.propertiesSchema && typeof node.propertiesSchema === 'object') {
        injectInto(node.propertiesSchema);
      }
      for (const k of Object.keys(node)) walk(node[k]);
    }
  }
  walk(parsed);
}

// Citeck overrides on top of the Camel catalog (see docs/plans/kaoto-mvp-finalization.md §1).
// The source of truth is public/camel-catalog-overrides/components.json in aggregate-components format
// (top-level keys = the names of our components: ecos-event, ecos-endpoint, ...).
// When serving any `aggregate-components-*.json` we do a shallow merge on top of the parsed JSON —
// adding our top-level keys without overriding fields of existing components.
const COMPONENT_OVERRIDES_FILE = path.resolve(__dirname, 'public/camel-catalog-overrides/components.json');
// Allowlist for Apache Camel schemes (see docs/plans/kaoto-palette-consolidation.md §4): runtime-derived
// from ecos-integrations/pom.xml + ecos-edi/pom.xml + ecos-camel/pom.xml + camel-core builtins. Applied
// BEFORE the Citeck overrides — Citeck schemes reach the catalog regardless of the allowlist (via components.json).
// If the file is missing or broken, the filter is not applied (loadComponentAllowlist → null).
const COMPONENT_ALLOWLIST_FILE = path.resolve(__dirname, 'public/camel-catalog-overrides/allowlist.json');
const AGGREGATE_COMPONENTS_REGEX = /aggregate-components(?:-[0-9a-f]+)?\.json$/;

function loadComponentOverrides() {
  if (!existsSync(COMPONENT_OVERRIDES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(COMPONENT_OVERRIDES_FILE, 'utf-8'));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[serve-camel-catalog] failed to parse component overrides:', e.message);
    return {};
  }
}

function serveCamelCatalogPlugin() {
  const catalogRoot = path.resolve(__dirname, 'node_modules/@kaoto/camel-catalog/dist/camel-catalog');
  const sanitizedCache = new Map();
  let componentOverrides = loadComponentOverrides();
  let componentAllowlist = loadComponentAllowlist(COMPONENT_ALLOWLIST_FILE);

  const readSanitized = filePath => {
    const cached = sanitizedCache.get(filePath);
    if (cached) return cached;
    const raw = readFileSync(filePath, 'utf-8');
    let buf;
    try {
      const parsed = JSON.parse(raw);
      sanitizeCatalogJsonInPlace(parsed);
      liftItemsDefinitions(parsed);
      if (AGGREGATE_COMPONENTS_REGEX.test(filePath)) {
        // Filter runs BEFORE override-merge so Citeck schemes always pass through.
        if (componentAllowlist) {
          for (const name of Object.keys(parsed)) {
            if (!componentAllowlist.has(name)) delete parsed[name];
          }
        }
        Object.assign(parsed, componentOverrides);
      }
      // Not for camelYamlDsl itself — there definitions are already at the root after the lift.
      if (!/[\\/]camelYamlDsl-/.test(filePath)) {
        const runtimeDefs = loadRuntimeDefinitions(filePath);
        injectMissingDefinitionsIntoPropertiesSchemas(parsed, runtimeDefs);
      }
      buf = Buffer.from(JSON.stringify(parsed));
    } catch {
      buf = Buffer.from(raw);
    }
    sanitizedCache.set(filePath, buf);
    return buf;
  };

  // Hot-reload overrides + allowlist in dev: on each file change we clear the cache of all
  // aggregate-components-*.json and re-read the corresponding source — the next request merges the fresh data.
  const invalidateAggregateCache = () => {
    for (const key of sanitizedCache.keys()) {
      if (AGGREGATE_COMPONENTS_REGEX.test(key)) sanitizedCache.delete(key);
    }
  };
  const watchOverrides = () => {
    if (existsSync(COMPONENT_OVERRIDES_FILE)) {
      try {
        fsWatch(COMPONENT_OVERRIDES_FILE, () => {
          componentOverrides = loadComponentOverrides();
          invalidateAggregateCache();
          // eslint-disable-next-line no-console
          console.log('[serve-camel-catalog] component overrides reloaded');
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[serve-camel-catalog] fs.watch failed:', e.message);
      }
    }
    if (existsSync(COMPONENT_ALLOWLIST_FILE)) {
      try {
        fsWatch(COMPONENT_ALLOWLIST_FILE, () => {
          componentAllowlist = loadComponentAllowlist(COMPONENT_ALLOWLIST_FILE);
          invalidateAggregateCache();
          // eslint-disable-next-line no-console
          console.log('[serve-camel-catalog] component allowlist reloaded');
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[serve-camel-catalog] fs.watch (allowlist) failed:', e.message);
      }
    }
  };

  const catalogMiddleware = (req, res, next) => {
    let url = (req.url || '/').replace(/\?.*$/, '');
    if (url === '' || url === '/' || url.endsWith('/')) {
      url = path.posix.join(url, 'index.json');
    }
    const filePath = path.join(catalogRoot, url);
    // `startsWith(catalogRoot)` without a trailing separator would let sibling directories with a shared
    // prefix through (for example, `camel-catalog-evil/`). An explicit check via `path.relative` rejects
    // escaping outside catalogRoot regardless of any suffix.
    const rel = path.relative(catalogRoot, filePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    try {
      if (!statSync(filePath).isFile()) return next();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(filePath.endsWith('.json') ? readSanitized(filePath) : readFileSync(filePath));
    } catch {
      next();
    }
  };

  return {
    name: 'serve-camel-catalog',
    configureServer(server) {
      server.middlewares.use('/camel-catalog', catalogMiddleware);
      watchOverrides();
    },
    configurePreviewServer(server) {
      server.middlewares.use('/camel-catalog', catalogMiddleware);
    },
    writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'build');
      const targetDir = path.join(outDir, 'camel-catalog');
      cpSync(catalogRoot, targetDir, { recursive: true });
      // Walk targetDir and rewrite JSON files in place with sanitized + allowlist-filtered + overrides-merged version.
      const overrides = loadComponentOverrides();
      const allowlist = loadComponentAllowlist(COMPONENT_ALLOWLIST_FILE);
      const walk = dir => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(fp);
          else if (entry.isFile() && fp.endsWith('.json')) {
            try {
              const parsed = JSON.parse(readFileSync(fp, 'utf-8'));
              sanitizeCatalogJsonInPlace(parsed);
              liftItemsDefinitions(parsed);
              if (AGGREGATE_COMPONENTS_REGEX.test(fp)) {
                if (allowlist) {
                  for (const name of Object.keys(parsed)) {
                    if (!allowlist.has(name)) delete parsed[name];
                  }
                }
                Object.assign(parsed, overrides);
              }
              if (!/[\\/]camelYamlDsl-/.test(fp)) {
                const runtimeDefs = loadRuntimeDefinitions(fp);
                injectMissingDefinitionsIntoPropertiesSchemas(parsed, runtimeDefs);
              }
              writeFileSync(fp, JSON.stringify(parsed));
            } catch {
              /* skip non-JSON or unparsable */
            }
          }
        }
      };
      walk(targetDir);
    }
  };
}

// Kaoto SCSS uses webpack-style imports like `@forward '~@patternfly/...'`.
// Standard sass does not resolve such imports — so we add a custom importer.
const stripTildeSassImporter = {
  findFileUrl(url) {
    if (url.startsWith('~')) {
      return pathToFileURL(path.resolve(__dirname, 'node_modules', url.slice(1)));
    }
    return null;
  }
};

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
      sourcemap: true,
      minify: 'terser',
      chunkSizeWarningLimit: 1500,
      terserOptions: {
        keep_classnames: true,
        parse: {
          ecma: 2017
        },
        compress: {
          ecma: 5,
          comparisons: false,
          inline: 2,
          /** Attention! Don't forget to remove the 'debugger' from the codebase if you don't need it! **/
          drop_debugger: false // for debug on stand
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 5,
          comments: false,
          ascii_only: true
        }
      },
      rollupOptions: {
        output: {
          sourcemapPathTransform: relativeSourcePath => {
            return path.relative('src', relativeSourcePath).replace(/\\/g, '/');
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
          find: /^@citeck\/records-core$/,
          replacement: path.resolve(__dirname, 'packages/records-core/src/index.ts')
        },
        {
          find: /^@citeck\/records-core\//,
          replacement: path.resolve(__dirname, 'packages/records-core/src') + '/'
        },
        {
          find: /^@citeck\/records-predicates$/,
          replacement: path.resolve(__dirname, 'packages/records-predicates/src/index.ts')
        },
        {
          find: /^@citeck\/records-predicates\//,
          replacement: path.resolve(__dirname, 'packages/records-predicates/src') + '/'
        },
        {
          find: /^@citeck\/constants$/,
          replacement: path.resolve(__dirname, 'packages/constants/src/index.ts')
        },
        {
          find: /^@citeck\/constants\//,
          replacement: path.resolve(__dirname, 'packages/constants/src') + '/'
        },
        {
          // Compat for the gantt git submodule which still imports `@/constants`.
          find: /^@\/constants$/,
          replacement: path.resolve(__dirname, 'packages/constants/src/index.ts')
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        },
        // Access to internal @kaoto/kaoto modules not re-exported via the `exports` field
        // in package.json (CatalogTilesProvider/CatalogModalProvider/EntitiesProvider/...).
        // See RouteVisualizationWithCatalog.jsx and kaoto-mvp-finalization.md §"What is NOT included".
        {
          find: /^@kaoto-internal\/(.+)$/,
          replacement: path.resolve(__dirname, 'node_modules/@kaoto/kaoto/lib/esm') + '/$1'
        }
      ]
    },
    plugins: [
      react(),
      serveMonacoEditorPlugin(),
      serveCamelCatalogPlugin(),
      serveExcalidrawAssetsPlugin(),
      nodePolyfills({
        include: ['crypto', 'events']
      }),
      babel({
        babelHelpers: 'bundled',
        babelrc: false,
        configFile: false,
        exclude: '/**/node_modules/**',
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
          importers: [stripTildeSassImporter],
          // Injects the responsive breakpoint tokens + media-up/down/between/only mixins
          // into every compiled .scss so they are available everywhere with no @import.
          additionalData: '@use "@/styles/breakpoints" as *;\n',
          silenceDeprecations: ['global-builtin', 'color-functions', 'import', 'legacy-js-api'] // TODO: transfer all @import to @use
        }
      }
    }
  };
});
