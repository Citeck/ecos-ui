import React from 'react';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';

import FilesViewer from '../../../FilesViewer';
import { NODE_TYPES } from '../../../../constants/docLib';

const FileList = ({ isMobile, items, selected, lastClicked, openFolder, setSelected, setLastClicked }) => {
  const _onDoubleClick = (item, e) => {
    if (item.type === NODE_TYPES.DIR && typeof openFolder === 'function') {
      openFolder(item.id);
    }
  };

  const _onClick = (item, e) => {
    const currentId = item.id;
    if (!currentId) {
      return;
    }

    const ctrlKey = e.ctrlKey;
    const shiftKey = e.shiftKey;

    switch (true) {
      case isMobile:
      case ctrlKey:
        if (selected.includes(currentId)) {
          setSelected(selected.filter(id => id !== currentId));
          break;
        }

        setSelected([...selected, currentId]);
        break;
      case shiftKey:
        const currentIndex = items.findIndex(item => item.id === currentId);
        let lastClickedIndex = items.findIndex(item => item.id === lastClicked);
        if (lastClickedIndex === -1) {
          lastClickedIndex = 0;
        }

        const from = Math.min(currentIndex, lastClickedIndex);
        const to = Math.max(currentIndex, lastClickedIndex);

        const newSelected = [];
        for (let i = from; i <= to; i++) {
          newSelected.push(items[i].id);
        }

        setSelected(uniq([...selected, ...newSelected]));
        break;
      default:
        if (selected.length === 1 && selected[0] === currentId) {
          setSelected([]);
          break;
        }

        setSelected([currentId]);
        break;
    }

    setLastClicked(currentId);
  };

  return (
    <FilesViewer
      isMobile={isMobile}
      items={items}
      selected={selected}
      lastClicked={lastClicked}
      onClick={_onClick}
      onDoubleClick={_onDoubleClick}
    />
  );
};

FileList.propTypes = {
  isMobile: PropTypes.bool,
  items: PropTypes.array,
  selected: PropTypes.array,
  lastClicked: PropTypes.string,
  openFolder: PropTypes.func,
  setSelected: PropTypes.func,
  setLastClicked: PropTypes.func
};

export default FileList;
