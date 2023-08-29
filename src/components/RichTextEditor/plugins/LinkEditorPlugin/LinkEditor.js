import React, { useCallback, useEffect, useRef, useState } from 'react';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from 'lexical';

import { getSelectedNode, setFloatingElemPosition } from '../../utils';
import { IcoBtn } from '../../../common/btns';

import '../ToolbarPlugin/style.scss';
import { Input } from '../../../common/form';

export const LinkEditor = ({ editor, isLink, setIsLink, anchorElem }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [editedLinkUrl, setEditedLinkUrl] = useState('');
  const [lastSelection, setLastSelection] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const editorRef = useRef(null);
  const inputRef = useRef(null);

  const updateLinkEditor = useCallback(
    () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = getSelectedNode(selection);
        const parent = node.getParent();
        if ($isLinkNode(parent)) {
          setLinkUrl(parent.getURL());
        } else if ($isLinkNode(node)) {
          setLinkUrl(node.getURL());
        } else {
          setLinkUrl('');
        }
      }

      const editorElem = editorRef.current;
      const nativeSelection = window.getSelection();
      const activeElement = document.activeElement;

      if (editorElem === null) {
        return;
      }

      const rootElement = editor.getRootElement();

      if (
        selection !== null &&
        nativeSelection !== null &&
        rootElement !== null &&
        rootElement.contains(nativeSelection.anchorNode) &&
        editor.isEditable()
      ) {
        const domRange = nativeSelection.getRangeAt(0);
        let rect;
        if (nativeSelection.anchorNode === rootElement) {
          let inner = rootElement;
          while (inner.firstElementChild != null) {
            inner = inner.firstElementChild;
          }
          rect = inner.getBoundingClientRect();
        } else {
          rect = domRange.getBoundingClientRect();
        }

        setFloatingElemPosition(rect, editorElem, anchorElem);
        setLastSelection(selection);
      } else if (!activeElement || activeElement.className !== 'link-input') {
        if (rootElement !== null) {
          setFloatingElemPosition(null, editorElem, anchorElem);
        }
        setLastSelection(null);
        setIsEditMode(false);
        setLinkUrl('');
      }

      return true;
    },
    [editor, anchorElem]
  );

  useEffect(
    () => {
      setShowPreview(isLink);
    },
    [isLink, editor, anchorElem]
  );

  useEffect(
    () => {
      return mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            updateLinkEditor();
          });
        }),

        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateLinkEditor();
            return true;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            if (isLink) {
              setIsLink(false);
              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    },
    [editor, updateLinkEditor, setIsLink, isLink]
  );

  useEffect(
    () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    },
    [editor, updateLinkEditor]
  );

  const handleLinkSubmission = () => {
    if (lastSelection !== null) {
      if (linkUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, editedLinkUrl);
      }
      setIsEditMode(false);
    }
  };

  if (!isLink || !showPreview) {
    return null;
  }

  return (
    <div ref={editorRef} className="link-editor">
      {isEditMode ? (
        <div className="link-edit">
          <Input
            ref={inputRef}
            value={editedLinkUrl}
            onChange={event => {
              setEditedLinkUrl(event.target.value);
            }}
          />
          <div className="link-edit-buttons">
            <IcoBtn icon="icon-small-check" className="ecos-rt-editor-toolbar__button" onClick={handleLinkSubmission} />
            <IcoBtn
              icon="icon-small-close"
              className="ecos-rt-editor-toolbar__button"
              onClick={() => {
                setIsEditMode(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="link-view">
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            {linkUrl}
          </a>
        </div>
      )}
      {!isEditMode && (
        <div className="link-edit-buttons">
          <IcoBtn
            key="edit"
            icon="icon-edit"
            className="ecos-rt-editor-toolbar__button"
            onClick={() => {
              setEditedLinkUrl(linkUrl);
              setIsEditMode(true);
            }}
          />
          <IcoBtn
            icon="icon-small-close"
            className="ecos-rt-editor-toolbar__button"
            onClick={() => {
              setShowPreview(false);
            }}
          />
        </div>
      )}
    </div>
  );
};
