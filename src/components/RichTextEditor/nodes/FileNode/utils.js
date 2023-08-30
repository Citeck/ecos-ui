import { $applyNodeReplacement } from 'lexical';

import { FileNode } from './FileNode';

export const $isFileNode = node => node instanceof FileNode;

export const $createFileNode = ({ size, name, fileRecordId, key }) => $applyNodeReplacement(new FileNode(size, name, fileRecordId, key));

export const convertFileElement = domNode => {
  if (domNode && domNode.innerText) {
    try {
      const innerText = JSON.parse(domNode.innerText);

      if (innerText.type === FileNode.getHtmlElementType()) {
        const size = Number(innerText.size);
        const name = innerText.name;
        const fileRecordId = innerText.fileRecordId;
        const node = $createFileNode({ size, name, fileRecordId });

        return { node };
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  return null;
};
