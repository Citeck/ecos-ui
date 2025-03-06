/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Spread,
  TextNode,
  $applyNodeReplacement,
  type LexicalNode,
  type EditorConfig,
  type NodeKey,
  type SerializedTextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
    type: 'mention';
    version: 1;
  },
  SerializedTextNode
>;

function convertMentionElement(domNode: HTMLElement): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createMentionNode(textContent);
    return {
      node,
    };
  }

  return null;
}

const mentionStyle = `
  background-color: #fff6d9;
  padding: 0 5px;
  border-radius: 12px;
`;

export class MentionNode extends TextNode {
  __authorityId: string | undefined;
  __mention: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mention, node.__text, node.__key, node.__authorityId);
  }
  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(serializedNode.mentionName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(mentionName: string, text?: string, key?: NodeKey, id?: string) {
    super(text ?? mentionName, key);

    this.__mention = mentionName;
    this.__authorityId = id;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
      type: 'mention',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = mentionStyle;
    dom.className = 'mention';
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');

    if (this.__authorityId) {
      element.setAttribute('data-mention', this.__authorityId);
    }

    element.textContent = this.__text;

    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-mention')) {
          return null;
        }
        return {
          conversion: convertMentionElement,
          priority: 4,
        };
      },
    };
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createMentionNode(mentionName: string, id?: string): MentionNode {
  const mentionNode = new MentionNode(mentionName, undefined, undefined, id);
  mentionNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
