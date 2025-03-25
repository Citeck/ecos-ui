import { FORMAT_TEXT_COMMAND, LexicalEditor } from 'lexical';
import * as React from 'react';

import { useToolbarState } from '@/components/Lexical/context/ToolbarContext';
import { SHORTCUTS } from '@/components/Lexical/plugins/ShortcutsPlugin/shortcuts';
import { clearFormatting, dropDownActiveClass } from '@/components/Lexical/plugins/ToolbarPlugin/utils';
import { DropdownPreview } from '@/components/common/form';
import { t } from '@/helpers/export/util';

interface Format {
  value: string;
  onClick: () => void;
  className: string;
  label: string;
  shortcutCommand?: string;
}

export function TextFormatDropdown({ isEditable, activeEditor }: { isEditable: boolean; activeEditor: LexicalEditor }) {
  const { toolbarState } = useToolbarState();

  const formats: Format[] = [
    {
      value: 'strikethrough',
      onClick: () => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
      className: dropDownActiveClass(toolbarState.isStrikethrough),
      label: t('lexical.plugins.toolbar.options-styles.strikethrough'),
      shortcutCommand: SHORTCUTS.STRIKETHROUGH
    },
    {
      value: 'subscript',
      onClick: () => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'),
      className: dropDownActiveClass(toolbarState.isSubscript),
      label: t('lexical.plugins.toolbar.options-styles.subscript'),
      shortcutCommand: SHORTCUTS.SUBSCRIPT
    },
    {
      value: 'superscript',
      onClick: () => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'),
      className: dropDownActiveClass(toolbarState.isSuperscript),
      label: t('lexical.plugins.toolbar.options-styles.superscript'),
      shortcutCommand: SHORTCUTS.SUPERSCRIPT
    },
    {
      value: 'highlight',
      onClick: () => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight'),
      className: dropDownActiveClass(toolbarState.isHighlight),
      label: t('lexical.plugins.toolbar.options-styles.highlight')
    },
    {
      value: 'clear',
      onClick: () => clearFormatting(activeEditor),
      className: '',
      label: t('lexical.plugins.toolbar.options-styles.clear.title'),
      shortcutCommand: SHORTCUTS.CLEAR_FORMATTING
    }
  ];

  const CustomItem = ({ item, onClick }: { item: Format; onClick: (value: string) => void }) => (
    <button onClick={() => onClick(item.value)} className={'item wide ' + item.className} title={item.label}>
      <div className="icon-text-container">
        <i className={`icon ${item.value}`} />
        <span className="text">{item.label}</span>
      </div>
      {item.shortcutCommand && <span className="shortcut">{item.shortcutCommand}</span>}
    </button>
  );

  const onChangeDropdown = (value: string) => {
    const found = formats.find(format => format.value === value);
    found?.onClick();
  };

  return (
    <DropdownPreview
      disabled={!isEditable}
      buttonLabel=""
      source={formats}
      CustomItem={CustomItem}
      onChange={onChangeDropdown}
      titleField="label"
      valueField="value"
      menuClassName="dropdown"
      toggleClassName="toolbar-item spaced"
      buttonIconClassName="icon dropdown-more"
    />
  );
}
