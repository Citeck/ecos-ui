import { $applyNodeReplacement } from 'lexical';

import { FileNode } from './FileNode';

export const $isFileNode = node => node instanceof FileNode;

export const $createFileNode = ({ size, name, fileRecordId, key }) => $applyNodeReplacement(new FileNode(size, name, fileRecordId, key));

export const convertFileElement = domNode => {
  if (
    domNode &&
    domNode.hasAttribute('data-lexical-size') &&
    domNode.hasAttribute('data-lexical-name') &&
    domNode.hasAttribute('data-lexical-file-id')
  ) {
    const size = Number(domNode.getAttribute('data-lexical-size'));
    const name = domNode.getAttribute('data-lexical-name');
    const fileRecordId = domNode.getAttribute('data-lexical-file-id');
    const node = $createFileNode({ size, name, fileRecordId });
    return { node };
  }

  return null;
};
