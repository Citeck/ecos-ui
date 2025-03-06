/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP, getLanguageFriendlyName } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
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
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  LexicalEditor,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { JSX, Dispatch, useCallback, useEffect, useState } from 'react';
import * as React from 'react';

import { IcoBtn } from '../../../common/btns';
import { blockTypeToBlockName, useToolbarState } from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { INSERT_COLLAPSIBLE_COMMAND } from '../CollapsiblePlugin';
import { OPEN_UPLOAD_MODAL } from '../FilePlugin/constants';
import { InsertImageDialog } from '../ImagesPlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import { InsertPollDialog } from '../PollPlugin';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import { InsertTableDialog } from '../TablePlugin';

import FontSize from './fontSize';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

import { t } from '@/helpers/export/util';
import { getRecordRef } from '@/helpers/urls';
import { isNodeRef } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
    options.push([lang, friendlyName]);
  }

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function dropDownActiveClass(active: boolean) {
  if (active) {
    return 'active dropdown-item-active';
  } else {
    return '';
  }
}

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={t(blockTypeToBlockName[blockType])}
      buttonAriaLabel={t('lexical.plugins.toolbar.options-styles-label')}
    >
      <DropDownItem className={'item wide ' + dropDownActiveClass(blockType === 'paragraph')} onClick={() => formatParagraph(editor)}>
        <div className="icon-text-container">
          <i className="icon paragraph" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.normal')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NORMAL}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h1')}
        onClick={() => formatHeading(editor, blockType, 'h1')}
      >
        <div className="icon-text-container">
          <i className="icon h1" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.heading1')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING1}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h2')}
        onClick={() => formatHeading(editor, blockType, 'h2')}
      >
        <div className="icon-text-container">
          <i className="icon h2" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.heading2')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING2}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h3')}
        onClick={() => formatHeading(editor, blockType, 'h3')}
      >
        <div className="icon-text-container">
          <i className="icon h3" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.heading3')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING3}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'bullet')}
        onClick={() => formatBulletList(editor, blockType)}
      >
        <div className="icon-text-container">
          <i className="icon bullet-list" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.bullet')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.BULLET_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'number')}
        onClick={() => formatNumberedList(editor, blockType)}
      >
        <div className="icon-text-container">
          <i className="icon numbered-list" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.numbered-list')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NUMBERED_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'check')}
        onClick={() => formatCheckList(editor, blockType)}
      >
        <div className="icon-text-container">
          <i className="icon check-list" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.check-list')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CHECK_LIST}</span>
      </DropDownItem>
      <DropDownItem className={'item wide ' + dropDownActiveClass(blockType === 'quote')} onClick={() => formatQuote(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon quote" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.quote')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.QUOTE}</span>
      </DropDownItem>
      <DropDownItem className={'item wide ' + dropDownActiveClass(blockType === 'code')} onClick={() => formatCode(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon code" />
          <span className="text">{t('lexical.plugins.toolbar.options-styles.code')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CODE_BLOCK}</span>
      </DropDownItem>
    </DropDown>
  );
}

function Divider(): JSX.Element {
  return <div className="divider" />;
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel=""
      buttonIconClassName={`icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel={t('lexical.plugins.toolbar.align-label')}
    >
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className="icon left-align" />
          <span className="text">{t('lexical.plugins.toolbar.align.left')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.LEFT_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className="icon center-align" />
          <span className="text">{t('lexical.plugins.toolbar.align.center')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CENTER_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className="icon right-align" />
          <span className="text">{t('lexical.plugins.toolbar.align.right')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.RIGHT_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className="icon justify-align" />
          <span className="text">{t('lexical.plugins.toolbar.align.justify')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.JUSTIFY_ALIGN}</span>
      </DropDownItem>
      <Divider />
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className={'icon ' + (isRTL ? 'indent' : 'outdent')} />
          <span className="text">{t('lexical.plugins.toolbar.align.outdent')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.OUTDENT}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
        className="item wide"
      >
        <div className="icon-text-container">
          <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
          <span className="text">{t('lexical.plugins.toolbar.align.indent')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.INDENT}</span>
      </DropDownItem>
    </DropDown>
  );
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
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
          : $findMatchingParent(anchorNode, (e) => {
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
        matchingParent = $findMatchingParent(node, (parentNode) => $isElementNode(parentNode) && !parentNode.isInline());
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
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
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      $updateToolbar();
    });
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
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
        skipHistoryStack ? { tag: 'historic' } : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ color: value }, skipHistoryStack);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ 'background-color': value }, skipHistoryStack);
    },
    [applyStyleText],
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
    [activeEditor, selectedElementKey],
  );

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;
  const recordRef = getRecordRef();

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
        <DropDown
          disabled={!isEditable}
          buttonClassName="toolbar-item code-language"
          buttonLabel={getLanguageFriendlyName(toolbarState.codeLanguage)}
          buttonAriaLabel={t('lexical.plugins.toolbar.select-language')}
        >
          {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
            return (
              <DropDownItem
                className={`item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`}
                onClick={() => onCodeLanguageSelect(value)}
                key={value}
              >
                <span className="text">{name}</span>
              </DropDownItem>
            );
          })}
        </DropDown>
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
          <DropDown
            disabled={!isEditable}
            buttonClassName="toolbar-item spaced"
            buttonLabel=""
            buttonAriaLabel={t('lexical.plugins.toolbar.options-styles')}
            buttonIconClassName="icon dropdown-more"
          >
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
              }}
              className={'item wide ' + dropDownActiveClass(toolbarState.isStrikethrough)}
              title={t('lexical.plugins.toolbar.options-styles.strikethrough')}
              aria-label={t('lexical.plugins.toolbar.options-styles.strikethrough-label')}
            >
              <div className="icon-text-container">
                <i className="icon strikethrough" />
                <span className="text">{t('lexical.plugins.toolbar.options-styles.strikethrough')}</span>
              </div>
              <span className="shortcut">{SHORTCUTS.STRIKETHROUGH}</span>
            </DropDownItem>
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
              }}
              className={'item wide ' + dropDownActiveClass(toolbarState.isSubscript)}
              title={t('lexical.plugins.toolbar.options-styles.subscript')}
              aria-label={t('lexical.plugins.toolbar.options-styles.subscript-label')}
            >
              <div className="icon-text-container">
                <i className="icon subscript" />
                <span className="text">{t('lexical.plugins.toolbar.options-styles.subscript')}</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUBSCRIPT}</span>
            </DropDownItem>
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
              }}
              className={'item wide ' + dropDownActiveClass(toolbarState.isSuperscript)}
              title={t('lexical.plugins.toolbar.options-styles.superscript')}
              aria-label={t('lexical.plugins.toolbar.options-styles.superscript-label')}
            >
              <div className="icon-text-container">
                <i className="icon superscript" />
                <span className="text">{t('lexical.plugins.toolbar.options-styles.superscript')}</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUPERSCRIPT}</span>
            </DropDownItem>
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
              }}
              className={'item wide ' + dropDownActiveClass(toolbarState.isHighlight)}
              title={t('lexical.plugins.toolbar.options-styles.highlight')}
              aria-label={t('lexical.plugins.toolbar.options-styles.highlight-label')}
            >
              <div className="icon-text-container">
                <i className="icon highlight" />
                <span className="text">{t('lexical.plugins.toolbar.options-styles.highlight')}</span>
              </div>
            </DropDownItem>
            <DropDownItem
              onClick={() => clearFormatting(activeEditor)}
              className="item wide"
              title={t('lexical.plugins.toolbar.options-styles.clear.title')}
              aria-label={t('lexical.plugins.toolbar.options-styles.clear.title-label')}
            >
              <div className="icon-text-container">
                <i className="icon clear" />
                <span className="text">{t('lexical.plugins.toolbar.options-styles.clear.title')}</span>
              </div>
              <span className="shortcut">{SHORTCUTS.CLEAR_FORMATTING}</span>
            </DropDownItem>
          </DropDown>
          {canViewerSeeInsertDropdown && (
            <>
              <Divider />
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item spaced"
                buttonLabel={t('lexical.plugins.toolbar.insert')}
                buttonAriaLabel={t('lexical.plugins.toolbar.insert-label')}
                buttonIconClassName="icon plus"
              >
                <DropDownItem
                  onClick={() => {
                    activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                  }}
                  className="item"
                >
                  <i className="icon horizontal-rule" />
                  <span className="text">{t('lexical.plugins.toolbar.insert.horizontal')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('lexical.plugins.toolbar.insert.image'), (onClose) => (
                      <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
                    ));
                  }}
                  className="item"
                >
                  <i className="icon image" />
                  <span className="text">{t('image')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('lexical.plugins.toolbar.insert.table'), (onClose) => (
                      <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
                    ));
                  }}
                  className="item"
                >
                  <i className="icon table" />
                  <span className="text">{t('table')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('lexical.plugins.toolbar.insert.poll'), (onClose) => (
                      <InsertPollDialog activeEditor={activeEditor} onClose={onClose} />
                    ));
                  }}
                  className="item"
                >
                  <i className="icon poll" />
                  <span className="text">{t('poll')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('lexical.plugins.toolbar.insert.columns-layout'), (onClose) => (
                      <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
                    ));
                  }}
                  className="item"
                >
                  <i className="icon columns" />
                  <span className="text">{t('lexical.plugins.toolbar.columns-layout')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
                  }}
                  className="item"
                >
                  <i className="icon caret-right" />
                  <span className="text">{t('lexical.plugins.toolbar.collapsible-container')}</span>
                </DropDownItem>
              </DropDown>
            </>
          )}
        </>
      )}
      <Divider />
      <ElementFormatDropdown disabled={!isEditable} value={toolbarState.elementFormat} editor={activeEditor} isRTL={toolbarState.isRTL} />
      <Divider />
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
      {modal}
    </div>
  );
}
