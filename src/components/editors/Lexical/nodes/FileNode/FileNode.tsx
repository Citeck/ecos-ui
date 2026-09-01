import { URL as Urls } from '@citeck/constants';
import { DecoratorNode, EditorConfig, LexicalEditor, SerializedLexicalNode } from 'lexical';
import React, { Suspense, JSX } from 'react';

import { $createFileNode, convertFileElement } from './utils';

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

  static isFileElement(element: HTMLElement): boolean {
    return element.getAttribute('type') === FileNode.getHtmlElementType();
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__size, node.__name, node.__fileRecordId, node.__key);
  }

  static importDOM(): Record<string, any> {
    return {
      // Declines anchors that are not file anchors: `LinkNode` registers `a` too and must keep them.
      // Claiming every `a` would hand Lexical a null conversion for an ordinary link and drop it.
      a: (node: HTMLElement) => (FileNode.isFileElement(node) ? { conversion: convertFileElement, priority: 2 } : null),
      span: () => ({
        conversion: convertFileElement,
        priority: 4
      })
    };
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const { name, size, fileRecordId } = serializedNode;
    return $createFileNode({
      size,
      name,
      fileRecordId
    });
  }

  exportDOM(): { element: HTMLElement } {
    const element = document.createElement('a');

    // `data-*` and lowercase on purpose: the comments backend cleans saved html with jsoup, which
    // lowercases attribute names, and its safelist names these explicitly (see CommentValidator).
    element.setAttribute('type', FileNode.getHtmlElementType());
    element.setAttribute('href', this.getDownLoadUrl());
    element.setAttribute('data-file-size', this.__size.toString());
    element.setAttribute('data-file-record-id', this.__fileRecordId);
    element.setAttribute('data-file-name', this.__name);
    element.setAttribute('style', 'margin: 0 6px;');
    element.textContent = this.__name;

    return { element };
  }

  exportJSON(): SerializedFileNode {
    return {
      size: this.__size,
      name: this.__name,
      fileRecordId: this.__fileRecordId,
      type: 'file',
      version: 1
    };
  }

  createDOM(config: any): HTMLElement {
    return document.createElement('span');
  }

  getDownLoadUrl = (): string => {
    const url = `${Urls.DASHBOARD}?recordRef=${this.__fileRecordId}`;
    return new URL(url, window.location.origin).toString().replace(window.location.origin, '');
  };

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return (
      <Suspense fallback={null}>
        <FileComponent
          size={this.__size}
          name={this.__name}
          downLoadUrl={this.getDownLoadUrl()}
          fileRecordId={this.__fileRecordId}
          editable={editor.isEditable()}
        />
      </Suspense>
    );
  }
}
