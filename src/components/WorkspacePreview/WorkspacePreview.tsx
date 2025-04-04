import classNames from 'classnames';
import React from 'react';
import './styles.scss';

const WorkspacePreview = ({ url = '', name = '', hovered = false }) => {
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
      ) : (
        <div className="workspace-preview__preview">{getInitials(name)}</div>
      )}
    </div>
  );
};

export default WorkspacePreview;
