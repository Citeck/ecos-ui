/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { editorStateFromSerializedDocument } from '@lexical/file';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { CONNECTED_COMMAND } from '@lexical/yjs';
import { $getRoot, $isParagraphNode, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_EDITOR } from 'lexical';
import React, { useEffect, useState, JSX } from 'react';

import { INITIAL_SETTINGS } from '../../appSettings';
import { docFromHash } from '../../utils/docSerialization';
import { SPEECH_TO_TEXT_COMMAND, SUPPORT_SPEECH_RECOGNITION } from '../SpeechToTextPlugin';

import type { LexicalEditor } from 'lexical';

import { t } from '@/helpers/export/util';

async function validateEditorState(editor: LexicalEditor): Promise<void> {
  const stringifiedEditorState = JSON.stringify(editor.getEditorState());
  let response = null;
  try {
    response = await fetch('http://localhost:1235/validateEditorState', {
      body: stringifiedEditorState,
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      method: 'POST'
    });
  } catch {
    // NO-OP
  }
  if (response !== null && response.status === 403) {
    throw new Error('Editor state validation failed! Server did not accept changes.');
  }
}

export default function ActionsPlugin(props: { isRichText: boolean; shouldPreserveNewLinesInMarkdown: boolean }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  useEffect(() => {
    if (INITIAL_SETTINGS.isCollab) {
      return;
    }
    docFromHash(window.location.hash).then(doc => {
      if (doc && doc.source === 'Playground') {
        editor.setEditorState(editorStateFromSerializedDocument(editor, doc));
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      }
    });
  }, [editor]);
  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener(editable => {
        setIsEditable(editable);
      }),
      editor.registerCommand<boolean>(
        CONNECTED_COMMAND,
        payload => {
          const isConnected = payload;
          setConnected(isConnected);
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, prevEditorState, tags }) => {
      // If we are in read only mode, send the editor state
      // to server and ask for validation if possible.
      if (!isEditable && dirtyElements.size > 0 && !tags.has('historic') && !tags.has('collaboration')) {
        validateEditorState(editor);
      }
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        if (children.length > 1) {
          setIsEditorEmpty(false);
        } else {
          if ($isParagraphNode(children[0])) {
            const paragraphChildren = children[0].getChildren();
            setIsEditorEmpty(paragraphChildren.length === 0);
          } else {
            setIsEditorEmpty(false);
          }
        }
      });
    });
  }, [editor, isEditable]);

  return (
    <div className="actions">
      {SUPPORT_SPEECH_RECOGNITION && (
        <button
          onClick={() => {
            editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
            setIsSpeechToText(!isSpeechToText);
          }}
          className={'action-button action-button-mic ' + (isSpeechToText ? 'active' : '')}
          title={t('lexical.plugins.actions.speech')}
          aria-label={`${isSpeechToText ? 'Enable' : 'Disable'} ${t('lexical.plugins.actions.speech').toLowerCase()}`}
        >
          <i className="mic" />
        </button>
      )}
    </div>
  );
}
