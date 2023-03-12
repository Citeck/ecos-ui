import React, { Suspense } from 'react';
import { DecoratorNode } from 'lexical';

import { $createFileNode, convertFileElement } from './utils';
import { getDownloadContentUrl } from '../../../../helpers/urls';

const FileComponent = React.lazy(() => import('./FileComponent'));

export class FileNode extends DecoratorNode {
  __size;
  __name;
  __fileRecordId;

  constructor(size, name, fileRecordId, key) {
    super(key);

    this.__size = size;
    this.__name = name;
    this.__fileRecordId = fileRecordId;
  }

  static getType() {
    return 'file';
  }

  static clone(node) {
    return new FileNode(node.__size, node.__name, node.__fileRecordId);
  }

  static importDOM() {
    return {
      span: () => ({
        conversion: convertFileElement,
        priority: 4
      })
    };
  }

  static importJSON(serializedNode) {
    const { name, size, fileRecordId } = serializedNode;
    const node = $createFileNode({
      size,
      name,
      fileRecordId
    });

    return node;
  }

  exportDOM() {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-size', this.__size);
    element.setAttribute('data-lexical-name', this.__name);
    element.setAttribute('data-lexical-file-id', this.__fileRecordId);

    return { element };
  }

  exportJSON() {
    return {
      size: this.__size,
      name: this.__name,
      fileRecordId: this.__fileRecordId,
      type: 'file',
      version: 1
    };
  }

  createDOM(config) {
    const span = document.createElement('span');
    return span;
  }

  getDownLoadUrl = () => {
    const url = getDownloadContentUrl(this.__fileRecordId);
    // eslint-disable-next-line no-template-curly-in-string
    return url.replace('${recordRef}', this.__fileRecordId);
  };

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <Suspense fallback={null}>
        <FileComponent size={this.__size} name={this.__name} downLoadUrl={this.getDownLoadUrl()} />
      </Suspense>
    );
  }
}
