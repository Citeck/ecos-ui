import React from 'react';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import get from 'lodash/get';

import { NODE_TYPES } from '../../../../constants/docLib';
import FilesViewer from '../../../FilesViewer';
import { ActionTypes } from '../../../Records/actions/constants';
import { RecordActionsApi } from '../../../../api/recordActions';

const actionApi = new RecordActionsApi();

const FileList = ({
  isMobile,
  items = [],
  selected = [],
  lastClicked,
  setParentItem,
  openFolder,
  setSelected,
  setLastClicked,
  onDrop,
  isDragged
}) => {
  const _onDoubleClick = (item, e) => {
    if (item.type === NODE_TYPES.DIR && typeof openFolder === 'function') {
      openFolder(item.id);
    }

    const currentId = item.id;
    if (currentId && get(item, 'type') && item.type === NODE_TYPES.FILE) {
      const localIdIdx = currentId.indexOf('$') + 1;
      actionApi.executeAction({
        records: currentId.substring(localIdIdx),
        action: { type: ActionTypes.VIEW }
      });
    }
  };

  const _onClick = (item, e) => {
    const currentId = item.id;

    if (!currentId) {
      return;
    }

    switch (true) {
      case isMobile:
      case e.ctrlKey || e.metaKey:
        if (selected.includes(currentId)) {
          setSelected(selected.filter(id => id !== currentId));
          break;
        }

        setSelected([...selected, currentId]);
        break;
      case e.shiftKey:
        const currentIndex = items.findIndex(item => item.id === currentId);
        let lastClickedIndex = items.findIndex(item => item.id === lastClicked);
        if (lastClickedIndex === -1) {
          lastClickedIndex = 0;
        }

        const from = Math.min(currentIndex, lastClickedIndex);
        const to = Math.max(currentIndex, lastClickedIndex);

        const newSelected = [];
        for (let i = from; i <= to; i++) {
          newSelected.push(get(items, [i, 'id']));
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
      isDragged={isDragged}
      isMobile={isMobile}
      items={items}
      selected={selected}
      lastClicked={lastClicked}
      onClick={_onClick}
      onDoubleClick={_onDoubleClick}
      onDrop={onDrop}
      setParentItem={setParentItem}
    />
  );
};

FileList.propTypes = {
  isMobile: PropTypes.bool,
  isDragged: PropTypes.bool,
  items: PropTypes.array,
  selected: PropTypes.array,
  lastClicked: PropTypes.string,
  openFolder: PropTypes.func,
  setParentItem: PropTypes.func,
  setSelected: PropTypes.func,
  setLastClicked: PropTypes.func
};

export default FileList;
