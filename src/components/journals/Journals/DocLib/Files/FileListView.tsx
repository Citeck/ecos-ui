import React from 'react';

import { t } from '@/helpers/export/util';

import { FileItem } from '../types';
import FileListRow, { FileItemViewProps } from './FileListRow';

type FileListViewProps = Omit<FileItemViewProps, 'item' | 'isSelected' | 'isLastClicked'> & {
  items: FileItem[];
  selected: string[];
  lastClicked: string | null;
};

const Labels = {
  NAME: 'document-library.columns.name',
  MODIFIED: 'document-library.columns.modified'
};

const FileListView = ({ items, selected, lastClicked, ...itemProps }: FileListViewProps) => (
  <div className="citeck-doclib-files citeck-doclib-files_list">
    <div className="citeck-doclib-files__head">
      <span className="citeck-doclib-files__head-spacer" />
      <span className="citeck-doclib-files__head-name">{t(Labels.NAME)}</span>
      <span className="citeck-doclib-files__head-modified">{t(Labels.MODIFIED)}</span>
    </div>
    {items.map(item => (
      <FileListRow
        key={item.id}
        item={item}
        isSelected={selected.includes(item.id)}
        isLastClicked={lastClicked === item.id}
        {...itemProps}
      />
    ))}
  </div>
);

export default FileListView;
