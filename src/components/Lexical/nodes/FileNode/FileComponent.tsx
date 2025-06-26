import React from 'react';

import PageService from '@/services/PageService';
import './style.scss';

const FileComponent = ({ size, name = '', downLoadUrl = '' }: { size: number; name: string; downLoadUrl: string }) => {
  const openLink = () => {
    PageService.changeUrlLink(downLoadUrl, { openNewTab: true });
  };

  return (
    <span onClick={openLink} className="file-node__link">
      {name}
    </span>
  );
};

export default FileComponent;
