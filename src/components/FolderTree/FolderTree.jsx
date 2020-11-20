import React from 'react';
import PropTypes from 'prop-types';

import FolderTreeItem, { FolderTreeItemPropTypes } from './FolderTreeItem';
import './FolderTree.scss';

const FolderTree = ({ items, selected, onSelect, onUnfold, onFold }) => {
  const renderLevel = parent => {
    return items
      .filter(item => {
        if (!parent) {
          return !item.parent;
        }

        return item.parent === parent;
      })
      .map(item => {
        return (
          <FolderTreeItem
            key={item.id}
            item={item}
            isSelected={item.id === selected}
            onSelect={onSelect}
            onUnfold={onUnfold}
            onFold={onFold}
          >
            {renderLevel(item.id)}
          </FolderTreeItem>
        );
      });
  };

  return <div className="ecos-folder-tree">{renderLevel()}</div>;
};

FolderTree.defaultProps = {
  items: []
};

FolderTree.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape(FolderTreeItemPropTypes)).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  onUnfold: PropTypes.func,
  onFold: PropTypes.func
};

export default FolderTree;
