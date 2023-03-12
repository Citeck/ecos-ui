import React, { useState, useEffect } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { $generateNodesFromDOM } from '@lexical/html';
import { $insertNodes, $getRoot } from 'lexical';
import isNil from 'lodash/isNil';
import classNames from 'classnames';

import { CodeHightLightPlugin, FilePlugin, LinkEditorPlugin, MarkdownShortcutPlugin, ToolbarPlugin } from './plugins';
import { Placeholder } from './components';

import './style.scss';

export const EditorContent = ({ onChange, htmlString, readonly = false }) => {
  const [editor] = useLexicalComposerContext();
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

  const onRef = _floatingAnchorElem => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

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
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(htmlString, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);

          // const root = $getRoot();

          $getRoot().select();

          // Insert them at a selection.
          $insertNodes(nodes);
        });
      }
    },
    [htmlString, editor]
  );

  return (
    <>
      {!readonly && <ToolbarPlugin />}
      <div className="ecos-rt-editor">
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
        <FilePlugin />
        <ListPlugin />
        <LinkPlugin />
        <HistoryPlugin />
        <MarkdownShortcutPlugin />
        <CodeHightLightPlugin />
        {floatingAnchorElem && !readonly && (
          <>
            <LinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
        <OnChangePlugin onChange={onChange} />
      </div>
    </>
  );
};
