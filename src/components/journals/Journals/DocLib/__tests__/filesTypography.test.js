import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const TREE_SCSS = path.join(ROOT, 'src/components/journals/Journals/DocLib/FolderTreePanel/FolderTreePanel.scss');
const FILES_SCSS = path.join(ROOT, 'src/components/journals/Journals/DocLib/Files/FilesArea.scss');

/** `<div.citeck-doclib-tree__row> <span.citeck-doclib-tree__title>` — one folder of the tree. */
const treeRow = () => {
  const row = element('citeck-doclib-tree__row');
  const title = element('citeck-doclib-tree__title', {}, 'span');

  row.appendChild(title);

  return { row, title };
};

/** `<div.citeck-doclib-files__row> <span…-title> <span…-modified>` — one file of the list view. */
const fileRow = () => {
  const row = element('citeck-doclib-files__row');
  const title = element('citeck-doclib-files__row-title', {}, 'span');
  const modified = element('citeck-doclib-files__row-modified', {}, 'span');

  row.appendChild(title);
  row.appendChild(modified);

  return { row, title, modified };
};

/** The declared value on `el` or, when the element inherits it, on `parent`. */
const inherited = (el, parent, sheets, prop) => cascade(el, sheets, prop) || cascade(parent, sheets, prop);

/**
 * The folder tree sets the type size of the library (COREDEV-355: "different font sizes in the
 * tree, the main area and the header"). The list rows used to copy the journal table's 11px, so a
 * folder read 13px in the tree and 11px in the list next to it.
 */
describe('doclib list rows use the folder tree type size (COREDEV-355)', () => {
  let sheets;

  beforeAll(() => {
    sheets = [compileScss(TREE_SCSS), compileScss(FILES_SCSS)];
  });

  it('the tree row has an explicit size to inherit from (the premise)', () => {
    const { row } = treeRow();

    expect(cascade(row, sheets, 'font-size')).toBeTruthy();
    expect(cascade(row, sheets, 'font-weight')).toBeTruthy();
  });

  it.each(['font-size', 'font-weight'])('a file name reads like a tree folder (%s)', prop => {
    const tree = treeRow();
    const file = fileRow();

    expect(inherited(file.title, file.row, sheets, prop)).toBe(inherited(tree.title, tree.row, sheets, prop));
  });

  it.each(['font-size', 'font-weight'])('the modified date reads like a tree folder too (%s)', prop => {
    const tree = treeRow();
    const file = fileRow();

    expect(inherited(file.modified, file.row, sheets, prop)).toBe(inherited(tree.title, tree.row, sheets, prop));
  });
});
