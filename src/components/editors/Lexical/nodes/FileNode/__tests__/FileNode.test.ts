import { FileNode } from '../FileNode';

const anchor = (attributes: Record<string, string>) => {
  const node = document.createElement('a');

  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));

  return node;
};

describe('FileNode.importDOM', () => {
  it('claims a file anchor above the link node', () => {
    const importer = FileNode.importDOM().a(anchor({ type: FileNode.getHtmlElementType(), name: 'a.png', fileRecordId: 'emodel/doc@1' }));

    expect(importer).not.toBeNull();
    expect(importer.priority).toEqual(2);
    expect(typeof importer.conversion).toEqual('function');
  });

  it('declines an ordinary anchor so that it stays a link', () => {
    expect(FileNode.importDOM().a(anchor({ href: 'https://example.com' }))).toBeNull();
  });
});
