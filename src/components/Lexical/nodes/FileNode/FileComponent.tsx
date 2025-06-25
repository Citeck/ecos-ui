import React from 'react';

import './style.scss';

export const bytesToKBytes = (bytes: number) => (bytes / 1024).toFixed(2);

const FileComponent = ({ size, name = '', downLoadUrl = '' }: { size: number; name: string; downLoadUrl: string }) => {
  return (
    <a target="_blank" href={downLoadUrl} rel="noreferrer">
      {name}
    </a>
  );
};

export default FileComponent;
