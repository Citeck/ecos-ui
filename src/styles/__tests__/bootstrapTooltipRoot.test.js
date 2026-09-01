import { readFileSync } from 'fs';
import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

// The gantt widget plugin imports this stylesheet at startup (src/plugins/…/Widget/index.ts), so its
// rules sit in the global cascade of every page, not only where a gantt is rendered.
const GANTT_CSS = path.join(ROOT, 'node_modules/@svar-ui/react-gantt/dist-full/index.css');

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
