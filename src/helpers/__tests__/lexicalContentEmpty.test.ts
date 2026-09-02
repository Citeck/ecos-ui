import { $getRoot, $setSelection, createEditor } from 'lexical';

import PlaygroundNodes from '@/components/editors/Lexical/nodes/PlaygroundNodes';
import { $isEditorContentEmpty, updateEditorContent } from '@/helpers/lexical';

// The comment form greys out Send while the editor is empty. A comment can consist of nothing but
// an attached file or a picture — both are decorators, which carry no text at all — so emptiness
// cannot be read off the text length; and blank paragraphs must not pass for content either, since
// the root joins its blocks with a double line break and two empty paragraphs already "have text".

const isEmpty = (html: string): boolean => {
  const editor = createEditor({
    nodes: PlaygroundNodes,
    onError: e => {
      throw e;
    }
  });

  let empty = false;

  editor.update(
    () => {
      $getRoot().selectStart();
      updateEditorContent(editor, html);
      $setSelection(null);
      empty = $isEditorContentEmpty();
    },
    { discrete: true }
  );

  return empty;
};

const FILE_HTML =
  '<p class="PlaygroundEditorTheme__paragraph"><a type="lexical-file-node" ' +
  'href="/v2/dashboard?recordRef=emodel/attachment@abc" data-file-size="10" ' +
  'data-file-record-id="emodel/attachment@abc" data-file-name="clip.mp4" style="">clip.mp4</a></p>';

const IMG_HTML = '<p><img src="/gateway/emodel/api/ecos/webapp/content?ref=attachment@abc" alt="pic.png"></p>';

describe('$isEditorContentEmpty', () => {
  it.each([
    ['nothing at all', ''],
    ['a blank paragraph', '<p><br></p>'],
    ['two blank paragraphs — the double line break between blocks is not content', '<p><br></p><p><br></p>'],
    ['spaces only', '<p>   </p>']
  ])('%s reads as empty', (_name, html) => {
    expect(isEmpty(html)).toBe(true);
  });

  it.each([
    ['text', '<p>a</p>'],
    ['an attached file alone', FILE_HTML],
    ['a picture alone', IMG_HTML],
    ['a divider alone', '<p><br></p><hr>'],
    ['a picture nested in a table cell', `<table><tbody><tr><td>${IMG_HTML}</td></tr></tbody></table>`],
    ['text nested in a table cell', '<table><tbody><tr><td><p>cell</p></td></tr></tbody></table>']
  ])('%s reads as content', (_name, html) => {
    expect(isEmpty(html)).toBe(false);
  });
});
