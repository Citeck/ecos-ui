import { ElementFormatType, FORMAT_ELEMENT_COMMAND, INDENT_CONTENT_COMMAND, LexicalEditor, OUTDENT_CONTENT_COMMAND } from 'lexical';
import * as React from 'react';
import { JSX } from 'react';

import { SHORTCUTS } from '@/components/Lexical/plugins/ShortcutsPlugin/shortcuts';
import { DropdownPreview } from '@/components/common/form';
import { t } from '@/helpers/export/util';

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
    name: 'Center Align'
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align'
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align'
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align'
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align'
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align'
  }
};

function Divider(): JSX.Element {
  return <div className="divider" />;
}

interface Format {
  value: string;
  iconClassName: string;
  label: string;
  onClick: () => void;
  shortcutCommand: string;
}

export function AlignFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];
  const formats: Format[] = [
    {
      value: 'left',
      iconClassName: 'left-align',
      label: t('lexical.plugins.toolbar.align.left'),
      onClick: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'),
      shortcutCommand: SHORTCUTS.LEFT_ALIGN
    },
    {
      value: 'center',
      iconClassName: 'center-align',
      label: t('lexical.plugins.toolbar.align.center'),
      onClick: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'),
      shortcutCommand: SHORTCUTS.CENTER_ALIGN
    },
    {
      value: 'right',
      iconClassName: 'right-align',
      label: t('lexical.plugins.toolbar.align.right'),
      onClick: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'),
      shortcutCommand: SHORTCUTS.RIGHT_ALIGN
    },
    {
      value: 'justify',
      iconClassName: 'justify-align',
      label: t('lexical.plugins.toolbar.align.justify'),
      onClick: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'),
      shortcutCommand: SHORTCUTS.JUSTIFY_ALIGN
    },
    {
      value: 'outdent',
      iconClassName: isRTL ? 'indent' : 'outdent',
      label: t('lexical.plugins.toolbar.align.outdent'),
      onClick: () => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),
      shortcutCommand: SHORTCUTS.OUTDENT
    },
    {
      value: 'indent',
      iconClassName: isRTL ? 'outdent' : 'indent',
      label: t('lexical.plugins.toolbar.align.indent'),
      onClick: () => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
      shortcutCommand: SHORTCUTS.INDENT
    }
  ];

  const CustomItem = ({ item, onClick }: { item: Format; onClick: (value: string) => void }) => (
    <>
      {item.value === 'outdent' && <Divider />}
      <button className="item wide" onClick={() => onClick(item.value)}>
        <div className="icon-text-container">
          <i className={`icon ${item.iconClassName}`} />
          <span className="text">{item.label}</span>
        </div>
        <span className="shortcut">{item.shortcutCommand}</span>
      </button>
    </>
  );

  const onChangeDropdown = (value: string) => {
    const found = formats.find(format => format.value === value);
    found?.onClick();
  };

  return (
    <DropdownPreview
      disabled={disabled}
      buttonLabel=""
      source={formats}
      CustomItem={CustomItem}
      onChange={onChangeDropdown}
      titleField="label"
      valueField="value"
      menuClassName="dropdown"
      toggleClassName="toolbar-item spaced alignment"
      buttonIconClassName={`icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`}
    />
  );
}
