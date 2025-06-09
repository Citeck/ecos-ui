import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { $isTextNode, DOMConversionMap, TextNode } from 'lexical';
import React, { JSX } from 'react';

import { LexicalEditorProps, SharedHistoryContext } from '../Lexical';
import { FlashMessageContext } from '../Lexical/context/FlashMessageContext';
import { SettingsContext } from '../Lexical/context/SettingsContext';
import { ToolbarContext } from '../Lexical/context/ToolbarContext';
import PlaygroundNodes from '../Lexical/nodes/PlaygroundNodes';
import { TableContext } from '../Lexical/plugins/TablePlugin';

import EditorContent from './EditorContent';
import { defaultTheme } from './themes';

import { extractStyles, getExtraStyles, getStylesOfClasses, setStyleNode } from '@/helpers/lexical';

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
          const parentStyles = getStylesOfClasses(
            element.parentElement ? extractStyles(element.parentElement) : '',
            element.parentElement?.classList
          );
          const output = importer.conversion(element);

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

function EditorWrapper({ readonly = false, ...props }: LexicalEditorProps): JSX.Element {
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
            <EditorContent {...props} readonly={readonly} />
          </ToolbarContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
}

export default function LexicalEditor({ readonly = false, ...props }: LexicalEditorProps): JSX.Element {
  return (
    <SettingsContext>
      <FlashMessageContext>
        <EditorWrapper {...props} readonly={readonly} />
      </FlashMessageContext>
    </SettingsContext>
  );
}
