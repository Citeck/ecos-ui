import React, { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Monospace', value: 'Monospace, monospace' },
  { label: 'Courier New', value: 'Courier New, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' }
];

export default function FontFamilyPlugin() {
  const [editor] = useLexicalComposerContext();
  const [selectedFont, setSelectedFont] = useState(FONT_FAMILIES[0].value);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(isOpen => !isOpen);

  const onChange = useCallback(
    value => {
      const newFont = value;
      setSelectedFont(newFont);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'font-family': newFont
          });
        }
      });
    },
    [editor]
  );

  const selectItemLabel = FONT_FAMILIES.find(item => item.value === selectedFont).label || selectedFont;

  return (
    <Dropdown isOpen={isOpen} toggle={toggle}>
      <DropdownToggle className="editor-dropdown" caret>
        {selectItemLabel}
      </DropdownToggle>
      <DropdownMenu>
        {FONT_FAMILIES.map(f => (
          <DropdownItem onClick={() => onChange(f.value)} key={f.value}>
            <span style={{ fontFamily: f.value }} className="text">
              {f.label}
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
