import React, { useState, useEffect } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $createTextNode, TextNode, ElementNode, $createParagraphNode } from 'lexical';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import classNames from 'classnames';

import { LENGTH_LIMIT } from '../widgets/Comments/Comment';
import {
  CodeHightLightPlugin,
  FilePlugin,
  LinkEditorPlugin,
  MarkdownShortcutPlugin,
  TablePlugin as CustomTablePlugin,
  ToolbarPlugin,
  ImagesPlugin,
  MentionsPlugin
} from './plugins';
import { Placeholder } from './components';
import { t } from '../../helpers/util';

import './style.scss';

export const EditorContent = ({ onChange, htmlString, readonly = false, hideToolbar = false, className, onEditorReady }) => {
  const [editor] = useLexicalComposerContext();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  const [isMaxLength, setIsMaxLength] = useState(false);
  const [textLength, setTextLength] = useState(0);

  const onRef = _floatingAnchorElem => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(
    () => {
      if (isFunction(onEditorReady)) {
        onEditorReady(editor);
      }
    },
    [onEditorReady]
  );

  useEffect(
    () => {
      const isReadonlyEditor = !editor.isEditable();

      if (!isNil(readonly) && readonly !== isReadonlyEditor) {
        editor.setEditable(isReadonlyEditor);
      }
    },
    [readonly, editor]
  );

  useEffect(
    () => {
      if (!isNil(htmlString)) {
        try {
          editor.update(() => {
            const parser = new DOMParser();
            const dom = parser.parseFromString(htmlString, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);

            const root = $getRoot();
            root.clear();
            root.select();

            nodes.forEach(node => {
              if (node instanceof TextNode) {
                const paragraph = $createParagraphNode();
                const textNode = $createTextNode(node.getTextContent());
                paragraph.append(textNode);
                root.append(paragraph);
                root.select();
              } else if (node instanceof ElementNode) {
                root.append(node);
              }
            });
          });
        } catch (e) {
          console.error(e);
        }
      }
    },
    [htmlString, editor]
  );

  return (
    <>
      {!readonly && !hideToolbar && <ToolbarPlugin />}
      <div className={classNames('ecos-rt-editor', className)}>
        <AutoFocusPlugin />
        <RichTextPlugin
          contentEditable={
            <div className="editor" ref={onRef}>
              <ContentEditable className={classNames('ecos-rt-editor__content', readonly ? 'content_readonly' : 'content_editable')} />
            </div>
          }
          placeholder={Placeholder}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ImagesPlugin />
        <FilePlugin />
        <ListPlugin />
        <LinkPlugin />
        <TablePlugin />
        <CustomTablePlugin />
        <HistoryPlugin />
        <MarkdownShortcutPlugin />
        <CodeHightLightPlugin />
        <MentionsPlugin />
        {floatingAnchorElem && !readonly && (
          <>
            <LinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
        <OnChangePlugin
          onChange={(state, editor, tags) => {
            const { textContent = '' } = editor.getRootElement();
            // console.log("getEditorState:", editor.getEditorState());

            setTextLength(textContent.length);
            setIsMaxLength(textContent.length > LENGTH_LIMIT);

            isFunction(onChange) && onChange(state, editor, tags, textContent.length === 0);
          }}
        />
      </div>
      {isMaxLength && (
        <div
          className="alert alert-danger"
          dangerouslySetInnerHTML={{
            __html: t('comments-widget.editor.limit.error', {
              textLength: textLength,
              limit: LENGTH_LIMIT
            })
          }}
        />
      )}
    </>
  );
};
