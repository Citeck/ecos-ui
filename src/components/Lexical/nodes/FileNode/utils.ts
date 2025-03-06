import { $applyNodeReplacement } from 'lexical';

import { FileNode } from './FileNode';

export interface FileNodeProps {
  size: number;
  name: string;
  fileRecordId: string;
}

export const $isFileNode = (node: any): node is FileNode => node instanceof FileNode;

export const $createFileNode = ({ size, name, fileRecordId, key }: FileNodeProps & { key?: string }): FileNode =>
  $applyNodeReplacement(new FileNode(size, name, fileRecordId, key));

export const convertFileElement = (domNode: HTMLElement | null): { node: FileNode } | null => {
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
