import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $isTextNode, DOMConversionMap, TextNode } from 'lexical';
// @ts-ignore
import { LexicalNode } from 'lexical/LexicalNode';
import isArray from 'lodash/isArray';
import React, { JSX } from 'react';

import { LexicalEditorProps, SharedHistoryContext } from '../Lexical';
import Settings from '../Lexical/Settings';
import { FlashMessageContext } from '../Lexical/context/FlashMessageContext';
import { SettingsContext } from '../Lexical/context/SettingsContext';
import { ToolbarContext } from '../Lexical/context/ToolbarContext';
import PlaygroundNodes from '../Lexical/nodes/PlaygroundNodes';
import { TableContext } from '../Lexical/plugins/TablePlugin';
import { parseAllowedFontSize } from '../Lexical/plugins/ToolbarPlugin/fontSize';
import { parseAllowedColor } from '../Lexical/ui/ColorPicker';

import EditorContent from './EditorContent';
import { defaultTheme } from './themes';

function getExtraStyles(element: HTMLElement): string {
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

function extractStyles(element: HTMLElement): string {
  if (!element) return '';

  let styleString = '';
  const indexes: number[] = [];
  const computedStyles: CSSStyleDeclaration = element?.style;

  Object.keys(computedStyles).forEach((key: string) => {
    if (isFinite(Number(key))) {
      indexes.push(Number(key));
    }
  });

  indexes.forEach(key => {
    const property = computedStyles[key];
    const value = computedStyles.getPropertyValue(property);

    if (value && value.trim() !== '') {
      styleString += `${property}: ${value}; `;
    }
  });

  return styleString;
}

function setStyleNode(node: null | LexicalNode | Array<LexicalNode>, styles: string) {
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

export const theme = defaultTheme;

function buildImportMap(): DOMConversionMap {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = importNode => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: element => {
          let parentStyles = element.parentElement ? extractStyles(element.parentElement) : '';
          const output = importer.conversion(element);

          // Lexical does not allow you to insert an external className
          if (element.parentElement?.classList.contains(theme.text?.strikethrough)) {
            parentStyles += 'text-decoration: line-through; ';
          }

          if (output === null || output.forChild === undefined || output.after !== undefined || output.node !== null) {
            if (output) {
              setStyleNode(output.node, parentStyles);
            }

            return output;
          }

          const extraStyles = getExtraStyles(element);

          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              }
            };
          }
          return output;
        }
      };
    };
  }

  return importMap;
}

function EditorWrapper({ htmlString, onChange, readonly = false, className, hideToolbar, onEditorReady }: LexicalEditorProps): JSX.Element {
  const initialConfig = {
    editable: !readonly,
    html: {
      import: buildImportMap()
    },
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      console.error(error);
    },
    theme
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <ToolbarContext>
            <EditorContent
              htmlString={htmlString}
              className={className}
              readonly={readonly}
              onChange={onChange}
              hideToolbar={hideToolbar}
              onEditorReady={onEditorReady}
            />
            <Settings />
          </ToolbarContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function LexicalEditor({
  htmlString,
  onChange,
  readonly = false,
  className,
  hideToolbar,
  onEditorReady
}: LexicalEditorProps): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <EditorWrapper
          htmlString={htmlString}
          className={className}
          readonly={readonly}
          onChange={onChange}
          hideToolbar={hideToolbar}
          onEditorReady={onEditorReady}
        />
      </FlashMessageContext>
    </SettingsContext>
  );
}
