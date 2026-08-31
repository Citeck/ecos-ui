import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

// A freeze+selectable grid header, as react-bootstrap-table renders it: the selection
// cell is unshifted in as the first <th> of the same sticky header row.
const header = () => {
  const grid = element('ecos-grid ecos-grid_freeze ecos-grid_selectable ecos-grid_selectable_multi');
  const table = element('table ecos-grid__table', {}, 'table');
  const thead = document.createElement('thead');
  const row = element('ecos-grid__header', {}, 'tr');
  const selectorTh = document.createElement('th');
  const dataTh = document.createElement('th');

  row.append(selectorTh, dataTh);
  thead.append(row);
  table.append(thead);
  grid.append(table);

  return { selectorTh, dataTh };
};

describe('master checkbox header cell under horizontal scroll (COREDEV-457)', () => {
  let css;

  beforeAll(() => {
    css = [compileScss(path.join(ROOT, 'src/components/common/grid/Grid/Grid.scss'))];
  });

  it('every header cell is sticky and opaque — the setting the selection cell must outrank', () => {
    const { selectorTh, dataTh } = header();

    for (const th of [selectorTh, dataTh]) {
      expect(cascade(th, css, 'position')).toBe('sticky');
      expect(cascade(th, css, 'background')).toMatch(/white|#fff/i);
    }
    expect(cascade(selectorTh, css, 'left')).toBe('0');
  });

  // Data header cells share one z-index, so whichever wins must do it by being higher, not by
  // DOM order: the selection cell comes first and an equal z-index lets the data cells slide
  // over it on horizontal scroll, hiding the master checkbox.
  it('the selection cell paints above the data header cells', () => {
    const { selectorTh, dataTh } = header();

    const selectorZ = parseInt(cascade(selectorTh, css, 'z-index'), 10);
    const dataZ = parseInt(cascade(dataTh, css, 'z-index'), 10);

    expect(selectorZ).toBeGreaterThan(dataZ);
  });
});
