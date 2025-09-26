import { $generateNodesFromDOM } from '@lexical/html';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  LexicalEditor,
  TextNode
} from 'lexical';
// @ts-ignore
import { LexicalNode } from 'lexical/LexicalNode';
import isArray from 'lodash/isArray';

import { $isImageNode } from '@/components/Lexical/nodes/ImageNode';
import { parseAllowedFontSize } from '@/components/Lexical/plugins/ToolbarPlugin/fontSize';
import { parseAllowedColor } from '@/components/Lexical/ui/ColorPicker';
import { theme } from '@/components/LexicalEditor';

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

    const root = $getRoot();
    const children = root.getChildren();

    if (children.length > 1) {
      const first = children[0];
      if ($isParagraphNode(first) && first.getTextContent() === '' && !first.getChildren().some(child => $isImageNode(child))) {
        first.remove();
      }

      const updatedChildren = root.getChildren();
      const last = updatedChildren[updatedChildren.length - 1];
      if ($isParagraphNode(last) && last.getTextContent() === '' && !last.getChildren().some(child => $isImageNode(child))) {
        last.remove();
      }
    }
  }
}
