import { TextNode } from 'lexical';

function convertMentionElement(domNode) {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createMentionNode(textContent);

    return {
      node
    };
  }

  return null;
}

const mentionStyle = 'background-color:#fff6d9;padding:0 5px;border-radius:12px';

export class MentionNode extends TextNode {
  __mention;

  static getType() {
    return 'mention';
  }

  static clone(node) {
    return new MentionNode(node.__mention, node.__text, node.__key);
  }

  static importJSON(serializedNode) {
    const node = $createMentionNode(serializedNode.mentionName);

    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);

    return node;
  }

  constructor(mentionName, id, key) {
    super(mentionName ?? id, key);

    this.__mention = mentionName;
    this.__authorityId = id;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
      type: 'mention',
      version: 1
    };
  }

  createDOM(config) {
    const dom = super.createDOM(config);

    dom.style.cssText = mentionStyle;
    dom.className = 'mention';

    return dom;
  }

  exportDOM() {
    const element = document.createElement('span');

    element.setAttribute('data-mention', this.__authorityId);
    element.textContent = this.__text;

    return { element };
  }

  isSegmented() {
    return false;
  }

  static importDOM() {
    return {
      span: domNode => {
        if (!domNode.hasAttribute('data-mention')) {
          return null;
        }

        return {
          conversion: convertMentionElement,
          priority: 1
        };
      }
    };
  }

  isTextEntity() {
    return true;
  }

  isToken() {
    return true;
  }
}

export function $createMentionNode(mentionName, id) {
  const mentionNode = new MentionNode(mentionName, id);

  mentionNode.setMode('segmented').toggleDirectionless();

  return mentionNode;
}

export function $isMentionNode(node) {
  return node instanceof MentionNode;
}
