import { LexicalEditor } from 'lexical';
import { JSX } from 'react';
import * as React from 'react';

import { blockTypeToBlockName } from '@/components/Lexical/context/ToolbarContext';
import { SHORTCUTS } from '@/components/Lexical/plugins/ShortcutsPlugin/shortcuts';
import {
  dropDownActiveClass,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote
} from '@/components/Lexical/plugins/ToolbarPlugin/utils';
import { DropdownPreview } from '@/components/common/form';
import { t } from '@/helpers/export/util';

const rootTypeToRootName = {
  root: 'Root',
  table: 'Table'
};

interface Format {
  blockType: keyof typeof blockTypeToBlockName;
  onClick: () => void;
  iconClassName: string;
  label: string;
  shortcutCommand: string;
}

export function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  const formats: Format[] = [
    {
      blockType: 'paragraph',
      iconClassName: 'paragraph',
      onClick: () => formatParagraph(editor),
      label: t('lexical.plugins.toolbar.options-styles.normal'),
      shortcutCommand: SHORTCUTS.NORMAL
    },
    {
      blockType: 'h1',
      iconClassName: 'h1',
      onClick: () => formatHeading(editor, blockType, 'h1'),
      label: t('lexical.plugins.toolbar.options-styles.heading1'),
      shortcutCommand: SHORTCUTS.HEADING1
    },
    {
      blockType: 'h2',
      iconClassName: 'h2',
      onClick: () => formatHeading(editor, blockType, 'h2'),
      label: t('lexical.plugins.toolbar.options-styles.heading2'),
      shortcutCommand: SHORTCUTS.HEADING2
    },
    {
      blockType: 'h3',
      iconClassName: 'h3',
      onClick: () => formatHeading(editor, blockType, 'h3'),
      label: t('lexical.plugins.toolbar.options-styles.heading3'),
      shortcutCommand: SHORTCUTS.HEADING3
    },
    {
      blockType: 'bullet',
      iconClassName: 'bullet-list',
      onClick: () => formatBulletList(editor, blockType),
      label: t('lexical.plugins.toolbar.options-styles.bullet'),
      shortcutCommand: SHORTCUTS.BULLET_LIST
    },
    {
      blockType: 'number',
      iconClassName: 'numbered-list',
      onClick: () => formatNumberedList(editor, blockType),
      label: t('lexical.plugins.toolbar.options-styles.numbered-list'),
      shortcutCommand: SHORTCUTS.NUMBERED_LIST
    },
    {
      blockType: 'check',
      iconClassName: 'check-list',
      onClick: () => formatCheckList(editor, blockType),
      label: t('lexical.plugins.toolbar.options-styles.check-list'),
      shortcutCommand: SHORTCUTS.CHECK_LIST
    },
    {
      blockType: 'quote',
      iconClassName: 'quote',
      onClick: () => formatQuote(editor, blockType),
      label: t('lexical.plugins.toolbar.options-styles.quote'),
      shortcutCommand: SHORTCUTS.QUOTE
    },
    {
      blockType: 'code',
      iconClassName: 'code',
      onClick: () => formatCode(editor, blockType),
      label: t('lexical.plugins.toolbar.options-styles.code'),
      shortcutCommand: SHORTCUTS.CODE_BLOCK
    }
  ];

  const onChangeDropdown = (type: keyof typeof blockTypeToBlockName) => {
    const foundFormat = formats.find(format => format.blockType === type);
    foundFormat?.onClick();
  };

  const CustomItem = ({ item, onClick }: { item: Format; onClick: (type: keyof typeof blockTypeToBlockName) => void }) => (
    <button onClick={() => onClick(item.blockType)} className={'item wide ' + dropDownActiveClass(blockType === item.blockType)}>
      <div className="icon-text-container">
        <i className={`icon ${item.iconClassName}`} />
        <span className="text">{item.label}</span>
      </div>
      <span className="shortcut">{item.shortcutCommand}</span>
    </button>
  );

  return (
    <DropdownPreview
      disabled={disabled}
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={t(blockTypeToBlockName[blockType])}
      source={formats}
      CustomItem={CustomItem}
      onChange={onChangeDropdown}
      valueField="blockType"
      titleField="label"
      menuClassName="dropdown"
      toggleClassName="toolbar-item spaced"
    />
  );
}
