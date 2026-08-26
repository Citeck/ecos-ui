import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import postcss from 'postcss';

const ROOT = path.resolve(__dirname, '../../..');

// The gantt widget plugin imports this stylesheet at startup (src/plugins/…/Widget/index.ts), so its
// rules sit in the global cascade of every page, not only where a gantt is rendered.
const GANTT_CSS = path.join(ROOT, 'node_modules/@svar-ui/react-gantt/dist-full/index.css');

// dart-sass takes jsdom's `window` for a browser and drops its file system, so the stylesheet is
// compiled by the CLI in a child process instead of in this jest worker.
const compileScss = file =>
  execFileSync(
    process.execPath,
    [path.join(ROOT, 'node_modules/sass/sass.js'), file, '--load-path', path.join(ROOT, 'node_modules'), '--no-source-map', '--quiet'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }
  );

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
const cascade = (el, sheets, prop, pseudo = null) => {
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

const element = (className, attributes = {}) => {
  const el = document.createElement('div');

  el.className = className;
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, value));

  return el;
};

/** The `arrowClassName="arrow-custom"` arrow of a reactstrap tooltip, inside its root. */
const customArrow = root => {
  const arrow = document.createElement('span');

  arrow.className = 'arrow arrow-custom';
  root.appendChild(arrow);

  return arrow;
};

describe('Bootstrap tooltip root vs. the gantt stylesheet (COREDEV-449)', () => {
  let bootstrapCss;
  let ganttCss;

  beforeAll(() => {
    bootstrapCss = compileScss(path.join(ROOT, 'src/styles/bootstrap.scss'));
    ganttCss = readFileSync(GANTT_CSS, 'utf8');
  });

  it('the gantt stylesheet really paints a bare `.tooltip` (the premise of the defence below)', () => {
    expect(cascade(element('tooltip'), [ganttCss], 'background-color')).toBe('#1a1e21');
  });

  // reactstrap always renders `bs-tooltip-auto` + `x-placement`; Bootstrap's own JS uses the
  // explicit placement classes. Both families must come out transparent.
  const roots = [
    ...['top', 'right', 'bottom', 'left'].map(placement => [
      `bs-tooltip-auto x-placement=${placement}`,
      element(`tooltip show bs-tooltip-auto`, { 'x-placement': placement })
    ]),
    ...['top', 'right', 'bottom', 'left'].map(placement => [`bs-tooltip-${placement}`, element(`tooltip show bs-tooltip-${placement}`)])
  ];

  describe.each(roots)('%s', (_, root) => {
    it('stays transparent when the gantt stylesheet loads first', () => {
      expect(cascade(root, [ganttCss, bootstrapCss], 'background-color')).toBe('transparent');
    });

    it('stays transparent when the gantt stylesheet loads last', () => {
      expect(cascade(root, [bootstrapCss, ganttCss], 'background-color')).toBe('transparent');
    });
  });

  it("leaves the gantt's own hint (a bare `.tooltip`) with the colour the gantt chose", () => {
    expect(cascade(element('tooltip'), [bootstrapCss, ganttCss], 'background-color')).toBe('#1a1e21');
    expect(cascade(element('tooltip'), [ganttCss, bootstrapCss], 'background-color')).toBe('#1a1e21');
  });

  // The view switcher of the BPMN/DMN designers asks for `placement="top"`, but it sits under the
  // page header, so Popper flips it to the bottom — where Bootstrap's own black border-triangle
  // arrow used to show once the dark root background no longer hid it.
  describe.each([
    ['bs-tooltip-auto x-placement=top', () => element('tooltip show bs-tooltip-auto', { 'x-placement': 'top' })],
    ['bs-tooltip-auto x-placement=bottom', () => element('tooltip show bs-tooltip-auto', { 'x-placement': 'bottom' })],
    ['bs-tooltip-top', () => element('tooltip show bs-tooltip-top')],
    ['bs-tooltip-bottom', () => element('tooltip show bs-tooltip-bottom')]
  ])('custom arrow under %s', (_, root) => {
    it('is a white rotated square, not a black border triangle', () => {
      const arrow = customArrow(root());

      expect(cascade(arrow, [bootstrapCss], 'border-width', '::before')).toBe('0');
      expect(cascade(arrow, [bootstrapCss], 'background-color', '::before')).toMatch(/^#fff(fff)?$/i);
    });
  });
});
