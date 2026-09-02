import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const DASHLET_SCSS = path.join(ROOT, 'src/components/dashboard/Dashlet/Dashlet.scss');
const ASSOC_SCSS = path.join(ROOT, 'src/components/dashboard/widgets/DocAssociations/style.scss');

/** `<div.dashlet> <div.dashlet__header-wrapper> <div.dashlet__header> <div.dashlet__header-actions>` */
const headerActions = () => {
  const dashlet = element('dashlet ecos-doc-associations');
  const wrapper = element('ecos-panel__head dashlet__header-wrapper');
  const header = element('dashlet__header');
  const actions = element('dashlet__header-actions');

  header.appendChild(actions);
  wrapper.appendChild(header);
  dashlet.appendChild(wrapper);

  return { dashlet, actions };
};

/** CSS properties whose non-default value makes an element a stacking context for its children. */
const STACKING_CONTEXT_TRIGGERS = [
  ['transform', ['none']],
  ['filter', ['none']],
  ['perspective', ['none']],
  ['will-change', ['auto']],
  ['isolation', ['auto']],
  ['contain', ['none']],
  ['mix-blend-mode', ['normal']],
  ['z-index', ['auto']]
];

/**
 * A dropdown that a widget puts among its header actions (the Associations "+" menu, z-index 1001)
 * is positioned inside `.dashlet__header-actions`. The 1px lift of the icon row was written as a
 * transform, and a transform makes the row a stacking context: the menu's z-index then only
 * competes with siblings inside the row, while the row itself paints at level 0 — the headers of
 * the neighbouring widgets and the Properties widget of the other column covered the open menu,
 * so its items could not be clicked (reported as "the associations widget is broken").
 */
describe('dashlet header actions do not trap a dropdown in their own stacking context', () => {
  let dashletCss;
  let assocCss;

  beforeAll(() => {
    dashletCss = compileScss(DASHLET_SCSS);
    assocCss = compileScss(ASSOC_SCSS);
  });

  it('the associations menu relies on a z-index above the page (the premise)', () => {
    const menu = element('ecos-dropdown__menu ecos-doc-associations__menu dropdown-menu show');

    expect(parseInt(cascade(menu, [assocCss], 'z-index'), 10)).toBeGreaterThan(0);
  });

  it.each(STACKING_CONTEXT_TRIGGERS)('the icon row declares no stacking-context trigger (%s)', (prop, defaults) => {
    const { actions } = headerActions();
    const value = cascade(actions, [dashletCss, assocCss], prop);

    expect(value === null || defaults.includes(value)).toBe(true);
  });

  it('the icon row still sits 1px above its static position, with its centring intact', () => {
    const { actions } = headerActions();

    // an absolutely positioned flex child is centred by its margin box: the pair keeps that box
    // height, so the lift is the full 1px and not half of it
    expect(cascade(actions, [dashletCss], 'margin-top')).toBe('-1px');
    expect(cascade(actions, [dashletCss], 'margin-bottom')).toBe('1px');
  });
});
