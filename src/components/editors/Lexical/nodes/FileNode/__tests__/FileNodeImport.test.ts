import { $generateNodesFromDOM } from '@lexical/html';
import { createEditor } from 'lexical';

import PlaygroundNodes from '../../PlaygroundNodes';
import { $isFileNode } from '../utils';

// `LinkNode` claims `a` at the same priority and is registered later, so without the node declining
// ordinary anchors this is the test that catches it losing the tie. The attributes below are the
// ones `CommentValidator` in ecos-model lets through a save.
const importHtml = (html: string) => {
  const editor = createEditor({
    nodes: PlaygroundNodes,
    onError: e => {
      throw e;
    }
  });

  let result: { file: any; types: string[] } = { file: null, types: [] };

  editor.update(
    () => {
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const flatten = (nodes: any[]): any[] =>
        nodes.flatMap(n => (typeof n.getChildren === 'function' ? [n, ...flatten(n.getChildren())] : [n]));
      const all = flatten($generateNodesFromDOM(editor, dom));
      const file = all.find($isFileNode);

      result = {
        types: all.map(n => n.getType()),
        file: file ? { recordId: file.__fileRecordId, name: file.__name, size: file.__size } : null
      };
    },
    { discrete: true }
  );

  return result;
};

describe('FileNode import from saved comment html', () => {
  it('rebuilds a file node from the attributes it exports', () => {
    const { file } = importHtml(
      '<p><a type="lexical-file-node" href="/v2/dashboard?recordRef=emodel/attachment@abc" ' +
        'data-file-size="10" data-file-record-id="emodel/attachment@abc" data-file-name="clip.mp4" style="">clip.mp4</a></p>'
    );

    expect(file).toEqual({ recordId: 'emodel/attachment@abc', name: 'clip.mp4', size: 10 });
  });

  it('leaves an anchor stripped of the file attributes to the link node', () => {
    const { file, types } = importHtml('<p><a href="/v2/dashboard?recordRef=emodel/attachment@abc">clip.mp4</a></p>');

    expect(file).toBeNull();
    expect(types).toContain('link');
  });

  it('leaves an ordinary link alone', () => {
    const { file, types } = importHtml('<p><a href="https://example.com">a link</a></p>');

    expect(file).toBeNull();
    expect(types).toContain('link');
  });
});
