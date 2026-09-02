import { $generateNodesFromDOM } from '@lexical/html';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  ElementNode,
  LexicalEditor,
  TextNode
} from 'lexical';
// @ts-ignore
import { LexicalNode } from 'lexical/LexicalNode';
import isArray from 'lodash/isArray';

import { parseAllowedFontSize } from '@/components/editors/Lexical/plugins/ToolbarPlugin/fontSize';
import { parseAllowedColor } from '@/components/editors/Lexical/ui/ColorPicker';
import { theme } from '@/components/editors/LexicalEditor';

type StyleCache = Record<string, string>;
const classToLexicalCodeColorMap: StyleCache = {};

export function initClassToColorMap(): void {
  const uniqueClasses = new Set(Object.values(theme.codeHighlight));

  uniqueClasses.forEach(className => {
    if (typeof className === 'string' && className) {
      const color = getStylePropertyFromClass(className, 'color');
      if (color) {
        classToLexicalCodeColorMap[className] = color;
      }
    }
  });
}

export function getExtraStyles(element: HTMLElement): string {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}

function getStylePropertyFromClass(className: string, property: keyof CSSStyleDeclaration): string {
  const el = document.createElement('div');
  el.style.display = 'none';
  el.className = className;
  document.body.appendChild(el);

  const value = getComputedStyle(el)[property];
  document.body.removeChild(el);

  return typeof value === 'string' ? value.trim() : '';
}

export function extractStyles(element: HTMLElement): string {
  if (!element) return '';

  let styleString = '';
  const indexes: number[] = [];
  const computedStyles: CSSStyleDeclaration = element?.style;

  const allowProperties: (keyof CSSStyleDeclaration)[] = ['color', 'backgroundColor'];

  Object.keys(computedStyles).forEach((key: string) => {
    if (isFinite(Number(key))) {
      indexes.push(Number(key));
    }
  });

  indexes.forEach(key => {
    const property = computedStyles[key] as keyof CSSStyleDeclaration;
    const value = computedStyles.getPropertyValue(property as string);

    if (value && value.trim() !== '' && allowProperties.includes(property)) {
      styleString += `${property}: ${value}; `;
    }
  });

  return styleString;
}

export function setStyleNode(node: null | LexicalNode | Array<LexicalNode>, styles: string) {
  if (isArray(node) && node.length) {
    node.forEach(node => {
      if (node instanceof TextNode) {
        node.setStyle(styles);
      }
    });
  }

  if (node instanceof TextNode) {
    node.setStyle(styles);
  }
}

export function getCodeStylesOfClasses(classList?: DOMTokenList): string {
  if (!classList) {
    return '';
  }

  for (const [className, color] of Object.entries(classToLexicalCodeColorMap)) {
    if (classList.contains(className)) {
      return `color: ${color};`;
    }
  }

  return '';
}

export function getStylesOfClasses(styles: string, classList?: DOMTokenList) {
  // Lexical does not allow you to insert an external className
  if (classList?.contains(theme.text?.strikethrough)) {
    styles += 'text-decoration: line-through; ';
  }

  styles += getCodeStylesOfClasses(classList);

  return styles;
}

const hasDecorator = (node: LexicalNode): boolean => {
  if ($isDecoratorNode(node)) {
    return true;
  }

  return $isElementNode(node) && node.getChildren().some(hasDecorator);
};

/**
 * The editor holds nothing worth keeping: no text of its own, and no decorator — a picture, an
 * attached file, a divider — which is content without a single character to show for it. Blank
 * paragraphs do not count: the root joins its blocks with a double line break, so two empty ones
 * already have a "text" of two newlines. Must run inside `editorState.read` or `editor.update`.
 */
export function $isEditorContentEmpty(): boolean {
  const root = $getRoot();

  return root.getTextContent().trim() === '' && !hasDecorator(root);
}

/**
 * The only blocks the trim may look into: a paragraph or a heading straight under the root. A table,
 * a list, a code block, a quote — anything else — is opaque: its blank cells and its leading spaces
 * are what the author put on the screen, and an empty table is still a table the reader sees.
 */
const isTextBlock = (node: LexicalNode | null): node is ElementNode => $isParagraphNode(node) || $isHeadingNode(node);

const isBlankBlock = (node: LexicalNode): boolean => isTextBlock(node) && node.getTextContent().trim() === '' && !hasDecorator(node);

/**
 * Blank text blocks at the very top and the very bottom of the document, in one pass each way. An
 * opaque block at the edge ends the pass: it is never dropped, not even an empty table.
 */
const dropBlankEdgeBlocks = (root: ElementNode): boolean => {
  let dropped = false;

  for (const edge of ['getFirstChild', 'getLastChild'] as const) {
    // the last block always stays: a document has to keep a paragraph to put the caret in
    while (root.getChildrenSize() > 1) {
      const block = root[edge]();

      if (!block || !isBlankBlock(block)) {
        break;
      }

      block.remove();
      dropped = true;
    }
  }

  return dropped;
};

/**
 * Whitespace and line breaks at one end of the document, down to the first thing worth keeping —
 * but only inside the edge text block. Descending from the root itself would land in a table cell,
 * a list item or a code line, where the same spaces are the author's layout and indentation. Inline
 * wrappers such as a link are fine to enter: Lexical removes one that cannot be empty together with
 * its last text node, so nothing is left dangling.
 */
const trimEdge = (root: ElementNode, side: 'first' | 'last'): boolean => {
  let trimmedAnything = false;

  for (;;) {
    const block = side === 'first' ? root.getFirstChild() : root.getLastChild();

    if (!isTextBlock(block)) {
      return trimmedAnything;
    }

    const leaf = side === 'first' ? block.getFirstDescendant() : block.getLastDescendant();

    if ($isLineBreakNode(leaf)) {
      leaf.remove();
      trimmedAnything = true;
      continue;
    }

    if (!$isTextNode(leaf)) {
      return trimmedAnything;
    }

    const text = leaf.getTextContent();
    const trimmed = side === 'first' ? text.replace(/^\s+/, '') : text.replace(/\s+$/, '');

    if (trimmed === text) {
      return trimmedAnything;
    }

    trimmedAnything = true;

    if (trimmed === '') {
      leaf.remove();
      continue;
    }

    leaf.setTextContent(trimmed);

    return true;
  }
};

/**
 * Cuts the empty lines and spaces off both ends of the document — the ones pressed before or after
 * the text, which say nothing and only push the comment around in the feed. Nothing the reader can
 * see may change: blank lines inside the text are the author's own spacing, a picture or an attached
 * file is content even though it has no text, and a table, a list or a code block at the edge is
 * left exactly as it is, empty or not. Must run inside `editor.update`.
 */
export function $trimEditorContent(): void {
  const root = $getRoot();
  let trimmedAnything = false;

  // each pass only ever removes something, and trimming an edge can uncover the next blank block
  while (dropBlankEdgeBlocks(root) || trimEdge(root, 'first') || trimEdge(root, 'last')) {
    trimmedAnything = true;
  }

  // the caret stays where it was pointing, which is now past the end of the text it was in, and
  // Lexical throws over that stale offset the moment it reconciles the selection
  if (trimmedAnything) {
    root.selectEnd();
  }
}

export function updateEditorContent(editor: LexicalEditor, value?: string | null) {
  $getRoot().clear();
  const phNode = $createParagraphNode();
  phNode.append($createTextNode(''));
  $getRoot().append(phNode);

  const parser = new DOMParser();
  const dom = parser.parseFromString(value ?? '', 'text/html');
  const nodes = $generateNodesFromDOM(editor, dom);
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    selection.insertNodes(nodes);
    // the placeholder paragraph above, and whatever blank line the stored html ends with
    dropBlankEdgeBlocks($getRoot());
  }
}
