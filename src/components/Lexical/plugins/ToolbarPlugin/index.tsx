/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeNode, CODE_LANGUAGE_MAP } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { $getSelectionStyleValueForProperty, $isParentElementRTL, $patchStyleText } from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import { $findMatchingParent, $getNearestNodeOfType, $isEditorIsNestedEditor, mergeRegister } from '@lexical/utils';
import classNames from 'classnames';
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  NodeKey,
  SELECTION_CHANGE_COMMAND
} from 'lexical';
import { JSX, Dispatch, useCallback, useEffect, useState } from 'react';
import * as React from 'react';

import { IcoBtn } from '../../../common/btns';
import { blockTypeToBlockName, useToolbarState } from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { OPEN_UPLOAD_MODAL } from '../FilePlugin/constants';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';

import AIAssistantButton from './AIAssistantButton';
import FontSize from './fontSize';
import { AlignFormatDropdown } from './formats/AlignFormat';
import { BlockFormatDropDown } from './formats/BlockFormat';
import { CodeFormatDropdown } from './formats/CodeFormat';
import { InsertFormatDropdown } from './formats/InsertFormat';
import { TextFormatDropdown } from './formats/TextFormat';

import { t } from '@/helpers/export/util';
import { isNodeRef } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

function Divider(): JSX.Element {
  return <div className="divider" />;
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
  isViewFileUploadBtn,
  attribute,
  recordRef
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
  isViewFileUploadBtn: boolean;
  attribute?: string;
  recordRef?: string;
}): JSX.Element {
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState('isImageCaption', !!rootElement?.parentElement?.classList.contains('image-caption-container'));
      } else {
        updateToolbarState('isImageCaption', false);
      }

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

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            updateToolbarState('blockType', type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            updateToolbarState('codeLanguage', language ? CODE_LANGUAGE_MAP[language] || language : '');
            return;
          }
        }
      }
      // Handle buttons
      updateToolbarState('fontColor', $getSelectionStyleValueForProperty(selection, 'color', '#000'));
      updateToolbarState('bgColor', $getSelectionStyleValueForProperty(selection, 'background-color', '#fff'));
      updateToolbarState('fontFamily', $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'));
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(node, parentNode => $isElementNode(parentNode) && !parentNode.isInline());
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left'
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState('isStrikethrough', selection.hasFormat('strikethrough'));
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState('fontSize', $getSelectionStyleValueForProperty(selection, 'font-size', '15px'));
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
  }, [activeEditor, editor, updateToolbarState]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      $updateToolbar();
    });
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener(editable => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        payload => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        payload => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: 'historic' } : {}
      );
    },
    [activeEditor]
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ color: value }, skipHistoryStack);
    },
    [applyStyleText]
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ 'background-color': value }, skipHistoryStack);
    },
    [applyStyleText]
  );

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl('https://'));
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  return (
    <div className="toolbar">
      {toolbarState.blockType in blockTypeToBlockName && activeEditor === editor && (
        <>
          <BlockFormatDropDown
            disabled={!isEditable}
            blockType={toolbarState.blockType}
            rootType={toolbarState.rootType}
            editor={activeEditor}
          />
          <Divider />
        </>
      )}
      {toolbarState.blockType === 'code' ? (
        <CodeFormatDropdown isEditable={isEditable} onCodeLanguageSelect={onCodeLanguageSelect} />
      ) : (
        <>
          <FontSize selectionFontSize={toolbarState.fontSize.slice(0, -2)} editor={activeEditor} disabled={!isEditable} />
          <Divider />
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
            className={'toolbar-item spaced ' + (toolbarState.isBold ? 'active' : '')}
            title={`${t('lexical.plugins.toolbar.format.bold')} (${SHORTCUTS.BOLD})`}
            type="button"
            aria-label={`${t('lexical.plugins.toolbar.format.bold-label')}: ${SHORTCUTS.BOLD}`}
          >
            <i className="format bold" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
            className={'toolbar-item spaced ' + (toolbarState.isItalic ? 'active' : '')}
            title={`${t('lexical.plugins.toolbar.format.italic')} (${SHORTCUTS.ITALIC})`}
            type="button"
            aria-label={`${t('lexical.plugins.toolbar.format.italic-label')}: ${SHORTCUTS.ITALIC}`}
          >
            <i className="format italic" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
            className={'toolbar-item spaced ' + (toolbarState.isUnderline ? 'active' : '')}
            title={`${t('lexical.plugins.toolbar.format.underline')} (${SHORTCUTS.UNDERLINE})`}
            type="button"
            aria-label={`${t('lexical.plugins.toolbar.format.underline-label')}: ${SHORTCUTS.UNDERLINE}`}
          >
            <i className="format underline" />
          </button>
          {canViewerSeeInsertCodeButton && (
            <button
              disabled={!isEditable}
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
              }}
              className={'toolbar-item spaced ' + (toolbarState.isCode ? 'active' : '')}
              title={t('lexical.plugins.toolbar.insert-code')}
              type="button"
              aria-label={t('lexical.plugins.toolbar.insert-code')}
            >
              <i className="format code" />
            </button>
          )}
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={'toolbar-item spaced ' + (toolbarState.isLink ? 'active' : '')}
            aria-label={t('lexical.plugins.toolbar.insert-link')}
            title={`${t('lexical.plugins.toolbar.insert-link')} (${SHORTCUTS.INSERT_LINK})`}
            type="button"
          >
            <i className="format link" />
          </button>
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={t('lexical.plugins.toolbar.color-label')}
            buttonIconClassName="icon font-color"
            color={toolbarState.fontColor}
            onChange={onFontColorSelect}
            title={t('lexical.plugins.toolbar.color')}
          />
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={t('lexical.plugins.toolbar.bg-color-label')}
            buttonIconClassName="icon bg-color"
            color={toolbarState.bgColor}
            onChange={onBgColorSelect}
            title={t('lexical.plugins.toolbar.bg-color')}
          />
          <TextFormatDropdown isEditable={isEditable} activeEditor={activeEditor} />
          {canViewerSeeInsertDropdown && (
            <>
              <InsertFormatDropdown showModal={showModal} editor={editor} activeEditor={activeEditor} isEditable={isEditable} />
            </>
          )}
        </>
      )}
      <AlignFormatDropdown disabled={!isEditable} value={toolbarState.elementFormat} editor={activeEditor} isRTL={toolbarState.isRTL} />
      <Divider />
      <AIAssistantButton
        key={`${recordRef}-${attribute}`}
        disabled={!isEditable}
        recordRef={recordRef}
        attribute={attribute}
      />
      {isViewFileUploadBtn && (
        <div className="citeck-lexical-editor__load-node">
          <IcoBtn
            title={t('editor.upload-file')}
            className={classNames('icon-upload', 'ecos-rt-editor-toolbar__button')}
            onClick={() => {
              if (isNodeRef(recordRef)) {
                NotificationManager.error(t('editor.upload-file-alfresco-error'));
                return;
              }

              editor.dispatchCommand(OPEN_UPLOAD_MODAL, undefined);
            }}
          />
        </div>
      )}
      {modal}
    </div>
  );
}
