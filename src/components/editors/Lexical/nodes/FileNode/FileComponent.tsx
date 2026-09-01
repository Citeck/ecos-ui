import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import FilePreviewModal from '../../ui/FilePreviewModal';

import { previewKindByFileName } from '@/api/docPreview';
import { getDownloadContentUrl, setDownloadParam } from '@/helpers/urls';
import PageService from '@/services/PageService';
import './style.scss';

const FileComponent = ({
  size,
  name = '',
  downLoadUrl = '',
  fileRecordId = '',
  // while the comment is being edited a click has to reach the node, not open a preview over it
  editable = false
}: {
  size: number;
  name: string;
  downLoadUrl: string;
  fileRecordId?: string;
  editable?: boolean;
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const kind = previewKindByFileName(name);
  // everything this ui can render opens in the modal; only what it cannot goes to the record card
  const isPreviewable = !editable && !!fileRecordId && kind !== 'none';

  const onClose = useCallback(() => setShowPreview(false), []);

  const onClick = () => {
    if (isPreviewable) {
      setShowPreview(true);
      return;
    }

    PageService.changeUrlLink(downLoadUrl, { openNewTab: true });
  };

  // `downLoadUrl` points at the record card; the content endpoint serves the bytes inline unless
  // asked to download.
  const contentUrl = isPreviewable ? setDownloadParam(getDownloadContentUrl(fileRecordId), false) : '';

  return (
    <>
      <span onClick={onClick} className="file-node__link">
        {name}
      </span>
      {showPreview &&
        isPreviewable &&
        createPortal(
          <FilePreviewModal kind={kind} src={contentUrl} fileName={name} recordId={fileRecordId} onClose={onClose} />,
          document.body
        )}
    </>
  );
};

export default FileComponent;
