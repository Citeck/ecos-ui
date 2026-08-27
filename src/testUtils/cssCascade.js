import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import postcss from 'postcss';

/** Repository root (this file lives in `src/testUtils`). */
export const ROOT = path.resolve(__dirname, '../..');

/**
 * Compile one stylesheet to CSS with the sass CLI.
 *
 * dart-sass takes jsdom's `window` for a browser and drops its file system, so the stylesheet is
 * compiled by the CLI in a child process instead of in the jest worker. The source is fed through
 * stdin with the Vite `@/` alias rewritten to `src/`, which the CLI does not know; relative imports
 * resolve through the file's own directory added as a load path.
 */
export const compileScss = file => {
  const source = readFileSync(file, 'utf8').replace(/(['"])@\//g, `$1${path.join(ROOT, 'src')}/`);

  return execFileSync(
    process.execPath,
    [
      path.join(ROOT, 'node_modules/sass/sass.js'),
      '--stdin',
      '--load-path',
      path.dirname(file),
      '--load-path',
      path.join(ROOT, 'node_modules'),
      '--no-source-map',
      '--quiet'
    ],
    { encoding: 'utf8', input: source, stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }
  );
};

/** (ids, classes/attributes/pseudo-classes, types/pseudo-elements) of one compound selector. */
const specificity = selector => {
  let s = selector;
  const count = re => {
    const n = (s.match(re) || []).length;
    s = s.replace(re, ' ');
    return n;
  };
  const c = count(/::[\w-]+/g);
  const a = count(/#[\w-]+/g);
  const b = count(/\[[^\]]+\]/g) + count(/\.[\w-]+/g) + count(/:[\w-]+(\([^)]*\))?/g);
  return [a, b, c + count(/[a-zA-Z][\w-]*/g)];
};

const compare = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

const PSEUDO_ELEMENT = /::?(before|after)$/;

/**
 * The winning declared value of `prop` on `el` (or on its `pseudo` element, e.g. '::before') across
 * `sheets` (in load order), by the plain CSS cascade: !important, then specificity, then source
 * order. jsdom's getComputedStyle ignores specificity, hence the hand-rolled resolution.
 */
export const cascade = (el, sheets, prop, pseudo = null) => {
  let winner = null;
  let order = 0;

  sheets.forEach(css => {
    postcss.parse(css).walkRules(rule => {
      rule.walkDecls(prop, decl => {
        rule.selectors.forEach(selector => {
          const pseudoMatch = selector.match(PSEUDO_ELEMENT);

          // A pseudo-element selector never matches the element itself, and vice versa.
          if (Boolean(pseudoMatch) !== Boolean(pseudo) || (pseudo && pseudoMatch[1] !== pseudo.replace(/:/g, ''))) {
            return;
          }

          let matches = false;

          try {
            matches = el.matches(selector.replace(PSEUDO_ELEMENT, ''));
          } catch (e) {
            // A selector jsdom cannot parse cannot be the winner either.
          }

          if (!matches) {
            return;
          }

          const candidate = { value: decl.value, important: decl.important ? 1 : 0, specificity: specificity(selector), order: order++ };
          const beats =
            !winner ||
            candidate.important - winner.important ||
            compare(candidate.specificity, winner.specificity) ||
            candidate.order - winner.order;

          if (beats > 0) {
            winner = candidate;
          }
        });
      });
    });
  });

  return winner ? winner.value : null;
};

/** A detached element with the given classes and attributes; `tag` defaults to div. */
export const element = (className, attributes = {}, tag = 'div') => {
  const el = document.createElement(tag);

  el.className = className;
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, value));

  return el;
};
