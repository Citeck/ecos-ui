import { NODE_TYPES } from '@citeck/constants/docLib';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';

import FileIcon from '@/components/common/FileIcon';
import { detectFormat } from '@/components/common/FileIcon/helpers';

import { FileItem } from '../types';
import { EcosIcon } from '../ui';

const DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export function formatModified(modified?: string): string {
  if (!modified) {
    return '—';
  }

  const date = moment(modified);

  return date.isValid() ? date.format(DATE_FORMAT) : '—';
}

export function FileItemIcon({ item, className }: { item: FileItem; className?: string }) {
  if (item.type === NODE_TYPES.DIR) {
    return <EcosIcon className={classNames('citeck-doclib-files__item-icon_dir', className)} data={{ value: 'icon-folder' }} />;
  }

  return <FileIcon className={className} format={detectFormat(item.title)} />;
}

/**
 * Legacy viewer class retained for styling compatibility; drop targets use item data.
 */
export const DROP_TARGET_CLASS = 'ecos-files-viewer__item';

export function getDragStartHandler(item: FileItem) {
  return (e: React.DragEvent) => {
    e.stopPropagation();
    const dragData = JSON.stringify({ id: item.id, title: item.title, type: item.type });
    e.dataTransfer.clearData();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', dragData);
  };
}
