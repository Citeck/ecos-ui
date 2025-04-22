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

export const convertFileElement = (domNode: HTMLElement | null): { node: FileNode } | undefined => {
  if (domNode) {
    try {
      const size = Number(domNode.getAttribute('size'));
      const name = domNode.getAttribute('name');
      const type = domNode.getAttribute('type');
      const fileRecordId = domNode.getAttribute('fileRecordId');

      if (type === FileNode.getHtmlElementType() && name && fileRecordId) {
        const node = $createFileNode({ size, name, fileRecordId });
        return { node };
      }

      return undefined;
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
};
