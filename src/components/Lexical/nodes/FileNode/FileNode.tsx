import { DecoratorNode, EditorConfig, LexicalEditor, SerializedLexicalNode } from 'lexical';
import React, { Suspense, JSX } from 'react';

import { $createFileNode, convertFileElement } from './utils';

import { getDownloadContentUrl } from '@/helpers/urls';

const FileComponent = React.lazy(() => import('./FileComponent'));

interface SerializedFileNode extends SerializedLexicalNode {
  size: number;
  name: string;
  fileRecordId: string;
}

export class FileNode extends DecoratorNode<JSX.Element> {
  private __size: number;
  private __name: string;
  private __fileRecordId: string;

  constructor(size: number, name: string, fileRecordId: string, key?: string) {
    super(key);
    this.__size = size;
    this.__name = name;
    this.__fileRecordId = fileRecordId;
  }

  static getType(): string {
    return 'file';
  }

  static getHtmlElementType(): string {
    return 'lexical-file-node';
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__size, node.__name, node.__fileRecordId, node.__key);
  }

  static importDOM(): Record<string, any> {
    return {
      span: () => ({
        conversion: convertFileElement,
        priority: 4,
      }),
    };
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { name, size, fileRecordId } = serializedNode;
    return $createFileNode({
      size,
      name,
      fileRecordId,
    });
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('span');
    const jsonObj = {
      type: FileNode.getHtmlElementType(),
      size: this.__size,
      name: this.__name,
      fileRecordId: this.__fileRecordId,
    };
    element.innerText = JSON.stringify(jsonObj);
    return { element };
  }

  exportJSON(): SerializedFileNode {
    return {
      size: this.__size,
      name: this.__name,
      fileRecordId: this.__fileRecordId,
      type: 'file',
      version: 1,
    };
  }

  createDOM(config: any): HTMLElement {
    return document.createElement('span');
  }

  getDownLoadUrl = (): string => {
    const url = getDownloadContentUrl(this.__fileRecordId);
    return url.replace('${recordRef}', this.__fileRecordId);
  };

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return (
      <Suspense fallback={null}>
        <FileComponent size={this.__size} name={this.__name} downLoadUrl={this.getDownLoadUrl()} />
      </Suspense>
    );
  }
}
