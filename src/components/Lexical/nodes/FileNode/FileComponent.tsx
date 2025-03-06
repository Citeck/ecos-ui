import React from 'react';

import { Icon } from '../../../common';
import './style.scss';

export const bytesToKBytes = (bytes: number) => (bytes / 1024).toFixed(2);

const FileComponent = ({ size, name = '', downLoadUrl = '' }: { size: number; name: string; downLoadUrl: string }) => {
  const [, fileExtension] = name.split('.');

  return (
    <div className="file-node">
      <div className="file-node__preview">{fileExtension}</div>
      <div className="file-node__info">
        <span className="file-node__info-name">{name}</span>
        <div className="file-node__info-size">{`${bytesToKBytes(size)} KB`}</div>
      </div>
      <div className="file-node__info-wrapper">
        <a href={downLoadUrl} download="file" data-external>
          <Icon className="icon-download file-node__info-download" />
        </a>
      </div>
    </div>
  );
};

export default FileComponent;
