/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $applyNodeReplacement, createEditor, DecoratorNode } from 'lexical';
import * as React from 'react';
import { Suspense, JSX } from 'react';

import joinClasses from '../utils/joinClasses';

import ImageSpinner from './ImageSpinner';

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  EditorThemeClasses,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread
} from 'lexical';

const ImageComponent = React.lazy(
  // @ts-ignore
  () => import('./ImageComponent')
);
export interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
  captionsEnabled?: boolean;
  file?: File;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const node = $createImageNode({ altText, height, src, width });
    return { node };
  }
  return null;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

const genClassName = (theme: EditorThemeClasses) => {
  return joinClasses(theme.image, 'editor-image');
};

/**
 * The display cap of the picture goes on the wrapper span, not on the <img>: a percentage max-width
 * on the image is ignored while the inline-block span works out its own width, so the span (and the
 * resize handles positioned against it) would stay as wide as the natural picture. On the span the
 * percentage resolves against the paragraph. A picture nobody has sized is capped at the node's
 * maxWidth; once it carries an explicit width only the paragraph limits it (COREDEV-475).
 */
export const applyWidthCap = (span: HTMLElement, width: 'inherit' | number, maxWidth: number): void => {
  span.style.maxWidth = width === 'inherit' ? `min(${maxWidth}px, 100%)` : '100%';
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __showCaption: boolean;
  __caption: LexicalEditor;
  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean;
  __file?: File;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key,
      node.__file
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, caption, src, showCaption } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src,
      width
    });
    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const className = genClassName(editor._config.theme);
    const element = document.createElement('img');
    element.className = className;

    // A browser downloads a picture the moment `src` lands on an <img>, attached to the page or not,
    // and the content service forbids caching it. This element exists to be serialised — the formio
    // textarea, MLLexicalEditor, useSyncWithInputHtml and the gantt description export the document
    // on every change — so it must not load: a lazy image only does once it is in a document and
    // near the viewport. `loading` has to be set before `src`; the other way round the download has
    // already started (COREDEV-380).
    element.setAttribute('loading', 'lazy');
    element.setAttribute('src', this.__src?.replace(window.location.origin, ''));
    element.setAttribute('alt', this.__altText);
    element.setAttribute('width', this.__width.toString());
    element.setAttribute('height', this.__height.toString());
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0
      })
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: LexicalEditor,
    captionsEnabled?: boolean,
    key?: NodeKey,
    file?: File
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__showCaption = showCaption || false;
    this.__caption = caption || createEditor();
    this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
    this.__file = file;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width
    };
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setFile(file: File | undefined): void {
    const writable = this.getWritable();
    writable.__file = file;
  }
  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = genClassName(theme);
    if (className !== undefined) {
      span.className = className;
    }
    applyWidthCap(span, this.__width, this.__maxWidth);
    return span;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): false {
    if (prevNode.__width !== this.__width || prevNode.__maxWidth !== this.__maxWidth) {
      applyWidthCap(dom, this.__width, this.__maxWidth);
    }
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getFile(): File | undefined {
    return this.__file;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          showCaption={this.__showCaption}
          caption={this.__caption}
          captionsEnabled={this.__captionsEnabled}
          resizable={true}
        />
        {this.__file && <ImageSpinner />}
      </Suspense>
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  width,
  showCaption,
  caption,
  key,
  file
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, maxWidth, width, height, showCaption, caption, captionsEnabled, key, file));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
