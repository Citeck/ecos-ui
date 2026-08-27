import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const BTN_SCSS = path.join(ROOT, 'src/components/common/btns/Btn/Btn.scss');
const PAGINATION_SCSS = path.join(ROOT, 'src/components/common/Pagination/Pagination.scss');
const DOCLIB_SCSS = path.join(ROOT, 'src/components/journals/Journals/DocLib/DocLib.scss');

/**
 * `<div.citeck-doclib__context-bar> <div.ecos-pagination.citeck-doclib__pagination> <button …arrow>`
 * — the context bar of DocLibView with the Pagination it renders while a folder has content.
 */
const contextBar = () => {
  const bar = element('citeck-doclib__context-bar');
  const pagination = element('ecos-pagination citeck-doclib__pagination');
  const arrow = element(
    'ecos-btn ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue ecos-pagination__arrow_new',
    {},
    'button'
  );

  pagination.appendChild(arrow);
  bar.appendChild(pagination);

  return { bar, arrow };
};

/**
 * The file area border moved by 6px between empty and non-empty folders and on every folder switch:
 * Pagination unmounts at total 0, and while mounted its arrows (40px `button.ecos-btn`) pushed the
 * 34px context bar to 40px — Pagination's own 20px rule targets `.ecos-pagination__arrow`, a class
 * the arrows do not carry. The bar height must not depend on whether Pagination is rendered.
 */
describe('doclib context bar keeps its height with and without Pagination (COREDEV-355)', () => {
  let btnCss;
  let paginationCss;
  let docLibCss;

  beforeAll(() => {
    btnCss = compileScss(BTN_SCSS);
    paginationCss = compileScss(PAGINATION_SCSS);
    docLibCss = compileScss(DOCLIB_SCSS);
  });

  it('a pagination arrow outside the doclib is a full-height button (the premise)', () => {
    const { arrow } = contextBar();

    expect(cascade(arrow, [btnCss, paginationCss], 'height')).toBe('40px');
  });

  it.each([
    ['DocLib.scss loads last', () => [btnCss, paginationCss, docLibCss]],
    ['DocLib.scss loads first', () => [docLibCss, btnCss, paginationCss]]
  ])('inside the doclib the arrows fit under the bar min-height (%s)', (_, sheets) => {
    const { bar, arrow } = contextBar();
    const barMinHeight = parseInt(cascade(bar, sheets(), 'min-height'), 10);
    const arrowHeight = parseInt(cascade(arrow, sheets(), 'height'), 10);

    expect(barMinHeight).toBe(34);
    expect(arrowHeight).toBeLessThanOrEqual(barMinHeight);
  });
});
