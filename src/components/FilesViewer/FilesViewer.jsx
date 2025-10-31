import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uuidV4 from 'uuidv4';

import { NODE_TYPES } from '../../constants/docLib';
import FilesViewerItem, { FilesViewerItemPropTypes } from './FilesViewerItem';
import './FilesViewer.scss';

const FilesViewer = ({ isDragged, isMobile, setParentItem, lastClicked, items: _items, selected, onClick, onDoubleClick, onDrop }) => {
  const hasTypeFile = _items.some(item => item.type === NODE_TYPES.FILE);
  const items = !hasTypeFile && isDragged ? [..._items, { isEmpty: true, id: uuidV4() }] : _items;

  return (
    <div className={classNames('ecos-files-viewer', { 'ecos-files-viewer_dragged-not-files': !hasTypeFile && isDragged })}>
      {items.map(item => (
        <FilesViewerItem
          setParentItem={setParentItem}
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
  isDragged: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape(FilesViewerItemPropTypes)).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string),
  lastClicked: PropTypes.string,
  onClick: PropTypes.func,
  setParentItem: PropTypes.func,
  onDoubleClick: PropTypes.func
};

export default FilesViewer;
