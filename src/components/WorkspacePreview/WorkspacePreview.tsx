import classNames from 'classnames';
import React, { ReactNode } from 'react';

import { WorkspaceType } from '@/api/workspaces/types';
import './styles.scss';

interface WorkspacePreviewProps {
  url?: WorkspaceType['image'];
  name: WorkspaceType['name'];
  hovered?: boolean;
  customImagePreview?: ReactNode;
}

const WorkspacePreview = ({ url = '', name = '', hovered = false, customImagePreview }: WorkspacePreviewProps) => {
  const getInitials = (name: WorkspacePreviewProps['name']) => {
    const nameParts = name.split(' ');
    return nameParts[0].charAt(0).toUpperCase();
  };

  return (
    <div className={classNames('workspace-preview', { 'workspace-preview__hovered': hovered })}>
      {url ? (
        <div className="workspace-preview__image-preview">
          <img src={url} alt={getInitials(name)} className="workspace-preview__image-preview_icon" />
        </div>
      ) : customImagePreview ? (
        customImagePreview
      ) : (
        <div className="workspace-preview__preview">{getInitials(name)}</div>
      )}
    </div>
  );
};

export default WorkspacePreview;
