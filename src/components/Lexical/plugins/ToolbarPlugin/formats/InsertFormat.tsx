import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { LexicalEditor } from 'lexical';
import * as React from 'react';
import { JSX } from 'react';

import { INSERT_COLLAPSIBLE_COMMAND } from '@/components/Lexical/plugins/CollapsiblePlugin';
import { InsertImageDialog } from '@/components/Lexical/plugins/ImagesPlugin';
import InsertLayoutDialog from '@/components/Lexical/plugins/LayoutPlugin/InsertLayoutDialog';
import { InsertTableDialog } from '@/components/Lexical/plugins/TablePlugin';
import { DropdownPreview } from '@/components/common/form';
import { t } from '@/helpers/export/util';

interface Format {
  value: string;
  iconClassName: string;
  label: string;
  onClick: () => void;
}

export function InsertFormatDropdown({
  isEditable,
  activeEditor,
  editor,
  showModal
}: {
  isEditable: boolean;
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  showModal: (title: string, content: (onClose: () => void) => JSX.Element) => void;
}) {
  const formats: Format[] = [
    {
      value: 'horizontal',
      iconClassName: 'horizontal-rule',
      label: t('lexical.plugins.toolbar.insert.horizontal'),
      onClick: () => {
        activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
      }
    },
    {
      value: 'image',
      iconClassName: 'image',
      label: t('image'),
      onClick: () => {
        showModal(t('lexical.plugins.toolbar.insert.image'), onClose => (
          <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
        ));
      }
    },
    {
      value: 'table',
      iconClassName: 'table',
      label: t('table'),
      onClick: () => {
        showModal(t('lexical.plugins.toolbar.insert.table'), onClose => (
          <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
        ));
      }
    },
    {
      value: 'columns',
      iconClassName: 'columns',
      label: t('lexical.plugins.toolbar.columns-layout'),
      onClick: () => {
        showModal(t('lexical.plugins.toolbar.insert.columns-layout'), onClose => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ));
      }
    },
    {
      value: 'caret-right',
      iconClassName: 'caret-right',
      label: t('lexical.plugins.toolbar.collapsible-container'),
      onClick: () => {
        editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
      }
    }
  ];

  const CustomItem = ({ item, onClick }: { item: Format; onClick: (value: string) => void }) => (
    <button className="item" onClick={() => onClick(item.value)}>
      <i className={`icon ${item.iconClassName}`} />
      <span className="text">{item.label}</span>
    </button>
  );

  const onChangeDropdown = (value: string) => {
    const found = formats.find(format => format.value === value);
    found?.onClick();
  };

  return (
    <DropdownPreview
      disabled={!isEditable}
      buttonLabel={t('lexical.plugins.toolbar.insert')}
      source={formats}
      CustomItem={CustomItem}
      onChange={onChangeDropdown}
      titleField="label"
      valueField="value"
      menuClassName="dropdown"
      toggleClassName="toolbar-item spaced"
      buttonIconClassName="icon plus"
    />
  );
}
