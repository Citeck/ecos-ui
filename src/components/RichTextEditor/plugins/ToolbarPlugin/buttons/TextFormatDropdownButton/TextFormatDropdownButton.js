import React from 'react';
import { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { $createHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection } from 'lexical';

export const blockTypeToBlockName = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  paragraph: 'Normal'
};

export const TextFormatDropdownButton = ({ editor, blockType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('Normal');

  const toggle = () => setIsOpen(isOpen => !isOpen);

  const formatParagraph = () => {
    setTitle(blockTypeToBlockName['paragraph']);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = headingSize => {
    setTitle(blockTypeToBlockName[headingSize]);
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  return (
    <>
      <Dropdown isOpen={isOpen} toggle={toggle}>
        <DropdownToggle className="editor-dropdown" caret>
          {title}
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={formatParagraph}>
            <span>Normal</span>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h1')}>
            <h1>Heading 1</h1>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h2')}>
            <h2>Heading 2</h2>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h3')}>
            <h3>Heading 3</h3>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h4')}>
            <h4>Heading 4</h4>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h5')}>
            <h5>Heading 5</h5>
          </DropdownItem>
          <DropdownItem onClick={() => formatHeading('h6')}>
            <h6>Heading 6</h6>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  );
};
