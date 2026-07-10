import React from 'react';

import { FileItem } from '../types';
import FileGridCard from './FileGridCard';
import { FileItemViewProps } from './FileListRow';

type FileGridViewProps = Omit<FileItemViewProps, 'item' | 'isSelected' | 'isLastClicked'> & {
  items: FileItem[];
  selected: string[];
  lastClicked: string | null;
};

const FileGridView = ({ items, selected, lastClicked, ...itemProps }: FileGridViewProps) => (
  <div className="citeck-doclib-files citeck-doclib-files_grid">
    {items.map(item => (
      <FileGridCard
        key={item.id}
        item={item}
        isSelected={selected.includes(item.id)}
        isLastClicked={lastClicked === item.id}
        {...itemProps}
      />
    ))}
  </div>
);

export default FileGridView;
