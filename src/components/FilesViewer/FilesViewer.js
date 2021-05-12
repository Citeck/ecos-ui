import React from 'react';
import PropTypes from 'prop-types';

import FilesViewerItem, { FilesViewerItemPropTypes } from './FilesViewerItem';
import './FilesViewer.scss';

const FilesViewer = ({ isMobile, lastClicked, items, selected, onClick, onDoubleClick, onDrop }) => {
  return (
    <div className="ecos-files-viewer">
      {items.map(item => (
        <FilesViewerItem
          key={item.id}
          item={item}
          isMobile={isMobile}
          isLastClicked={lastClicked === item.id}
          isSelected={selected.includes(item.id)}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};

FilesViewer.defaultProps = {
  items: [],
  selected: []
};

FilesViewer.propTypes = {
  isMobile: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape(FilesViewerItemPropTypes)).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string),
  lastClicked: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func
};

export default FilesViewer;
