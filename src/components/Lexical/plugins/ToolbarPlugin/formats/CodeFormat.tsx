import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, getLanguageFriendlyName } from '@lexical/code';
import * as React from 'react';

import { useToolbarState } from '@/components/Lexical/context/ToolbarContext';
import { dropDownActiveClass } from '@/components/Lexical/plugins/ToolbarPlugin/utils';
import { DropdownPreview } from '@/components/common/form';

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
    options.push([lang, friendlyName]);
  }

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

interface Format {
  name: string;
  value: string;
}

export function CodeFormatDropdown({
  isEditable,
  onCodeLanguageSelect
}: {
  isEditable: boolean;
  onCodeLanguageSelect: (value: string) => void;
}) {
  const { toolbarState } = useToolbarState();

  const formats: Format[] = [...CODE_LANGUAGE_OPTIONS.map(([value, name]) => ({ name, value }))];

  const onChangeDropdown = (value: string) => {
    onCodeLanguageSelect(value);
  };

  const CustomItem = ({ item, onClick }: { item: Format; onClick: (value: string) => void }) => (
    <button onClick={() => onClick(item.value)} className={`item ${dropDownActiveClass(item.value === toolbarState.codeLanguage)}`}>
      <span className="text">{item.name}</span>
    </button>
  );

  return (
    <DropdownPreview
      disabled={!isEditable}
      buttonLabel={getLanguageFriendlyName(toolbarState.codeLanguage)}
      source={formats}
      CustomItem={CustomItem}
      onChange={onChangeDropdown}
      valueField="blockType"
      titleField="label"
      menuClassName="dropdown"
      toggleClassName="toolbar-item code-language"
    />
  );
}
