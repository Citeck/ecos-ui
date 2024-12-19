import React from 'react';
import classNames from 'classnames';

const WorkspacePreview = ({ url = '', name, hovered = false }) => {
  const getInitials = name => {
    const nameParts = name.split(' ');

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
  };

  return (
    <div style={styles.container} className={classNames('workspace-preview', { 'workspace-preview__hovered': hovered })}>
      {url ? (
        <div style={styles.initialsWithIcon}>
          <img src={url} alt={url} style={styles.icon} />
        </div>
      ) : (
        <div style={styles.initials}>{getInitials(name)}</div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '10px'
  },
  icon: {
    width: '20px',
    height: '20px',
    objectFit: 'cover',
    filter: 'invert(1)'
  },
  initialsWithIcon: {
    display: 'flex',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  initials: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#ccc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff'
  }
};

export default WorkspacePreview;
