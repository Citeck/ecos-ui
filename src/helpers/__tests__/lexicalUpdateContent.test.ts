import { $getRoot, $setSelection, createEditor } from 'lexical';

import PlaygroundNodes from '@/components/editors/Lexical/nodes/PlaygroundNodes';
import { updateEditorContent } from '@/helpers/lexical';

// A comment whose only content is an attached file or a picture holds one decorator and no text at
// all. The empty-paragraph trimming below has to tell that apart from a genuinely empty paragraph,
// or the whole comment reads as blank.
const render = (html: string) => {
  const editor = createEditor({
    nodes: PlaygroundNodes,
    onError: e => {
      throw e;
    }
  });

  let types: string[] = [];

  editor.update(
    () => {
      $getRoot().selectStart();
      updateEditorContent(editor, html);
      const flatten = (nodes: any[]): any[] =>
        nodes.flatMap(n => (typeof n.getChildren === 'function' ? [n, ...flatten(n.getChildren())] : [n]));
      types = flatten($getRoot().getChildren()).map(n => n.getType());
      $setSelection(null);
    },
    { discrete: true }
  );

  return types;
};

const FILE_HTML =
  '<p class="PlaygroundEditorTheme__paragraph"><a type="lexical-file-node" ' +
  'href="/v2/dashboard?recordRef=emodel/attachment@abc" data-file-size="10" ' +
  'data-file-record-id="emodel/attachment@abc" data-file-name="clip.mp4" style="">clip.mp4</a></p>' +
  '<p class="PlaygroundEditorTheme__paragraph"><br></p>';

describe('updateEditorContent', () => {
  it('keeps a paragraph whose only child is an attached file', () => {
    expect(render(FILE_HTML)).toContain('file');
  });

  it('keeps a paragraph whose only child is a picture', () => {
    const types = render('<p><img src="/gateway/emodel/api/ecos/webapp/content?ref=attachment@abc" alt="pic.png"></p>');

    expect(types).toContain('image');
  });

  it('still drops a genuinely empty leading paragraph', () => {
    const types = render('<p><br></p><p>text</p>');

    expect(types.filter(t => t === 'paragraph')).toHaveLength(1);
  });
});
