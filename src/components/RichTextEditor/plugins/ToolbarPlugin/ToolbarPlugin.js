import React, { useState, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { $findMatchingParent, mergeRegister, $getNearestNodeOfType } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND
} from 'lexical';

import {
  BoldFormatButton,
  BulletListButton,
  blockTypeToBlockName,
  CodeFormatButton,
  ItalicFormatButton,
  LinkButton,
  NumericListButton,
  RedoButton,
  TableButton,
  TextFormatDropdownButton,
  UnderlineFormatButton,
  UndoButton,
  UploadButton
} from './buttons';

import './style.scss';

import { getSelectedNode } from '../../utils';
import { Divider } from '../../components/Divider';
import { FontFamilyPlugin } from '../FontFamilyPlugin';

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState('paragraph');
  const [listType, setListType] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isCodeBlock, setIsCodeBlock] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updateToolbar = useCallback(
    () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        let element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : $findMatchingParent(anchorNode, e => {
                const parent = e.getParent();
                return parent !== null && $isRootOrShadowRoot(parent);
              });

        if (element === null) {
          element = anchorNode.getTopLevelElementOrThrow();
        }

        const elementKey = element.getKey();
        const elementDOM = activeEditor.getElementByKey(elementKey);

        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));

        const node = getSelectedNode(selection);
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }

        if (elementDOM !== null) {
          if ($isListNode(element)) {
            const parentList = $getNearestNodeOfType(anchorNode, ListNode);
            const type = parentList ? parentList.getListType() : element.getListType();
            setListType(type);
          } else {
            setListType(null);
            const type = $isHeadingNode(element) ? element.getTag() : element.getType();
            if (type in blockTypeToBlockName) {
              setBlockType(type);
              setIsCodeBlock(false);
            }
            if ($isCodeNode(element)) {
              setIsCodeBlock(true);
              return;
            }
          }
        }
      }
    },
    [activeEditor]
  );

  useEffect(
    () => {
      return editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      );
    },
    [editor, updateToolbar]
  );

  useEffect(
    () => {
      return mergeRegister(
        activeEditor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            updateToolbar();
          });
        }),
        activeEditor.registerCommand(
          CAN_UNDO_COMMAND,
          payload => {
            setCanUndo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        activeEditor.registerCommand(
          CAN_REDO_COMMAND,
          payload => {
            setCanRedo(payload);
            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      );
    },
    [activeEditor, editor, updateToolbar]
  );

  return (
    <div className="ecos-rt-editor-toolbar">
      <UndoButton editor={activeEditor} canUndo={canUndo} />
      <RedoButton editor={activeEditor} canRedo={canRedo} />
      <Divider />
      <FontFamilyPlugin />
      <TextFormatDropdownButton editor={activeEditor} blockType={blockType} />
      <Divider />
      <BoldFormatButton editor={activeEditor} isBold={isBold} />
      <ItalicFormatButton editor={activeEditor} isItalic={isItalic} />
      <UnderlineFormatButton editor={activeEditor} isUnderline={isUnderline} />
      <BulletListButton editor={editor} listType={listType} />
      <NumericListButton editor={editor} listType={listType} />
      <TableButton editor={editor} />
      <Divider />
      <CodeFormatButton editor={activeEditor} isCodeBlock={isCodeBlock} />
      <LinkButton editor={activeEditor} isLink={isLink} />
      <UploadButton editor={activeEditor} />
    </div>
  );
};

export default ToolbarPlugin;
