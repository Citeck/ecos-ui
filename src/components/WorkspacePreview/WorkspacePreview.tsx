import classNames from 'classnames';
import React, { ReactNode } from 'react';
import './styles.scss';

interface WorkspacePreviewProps {
  url?: string | null;
  name: string;
  hovered?: boolean;
  customImagePreview?: ReactNode;
}

const WorkspacePreview = ({ url = '', name = '', hovered = false, customImagePreview }: WorkspacePreviewProps) => {
  const getInitials = (name: string) => {
    const nameParts = name.split(' ');
    return nameParts[0].charAt(0).toUpperCase();
  };

  return (
    <div className={classNames('workspace-preview', { 'workspace-preview__hovered': hovered })}>
      {url ? (
        <div className="workspace-preview__image-preview">
          <img src={url} alt={url} className="workspace-preview__image-preview_icon" />
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
