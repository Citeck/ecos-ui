import React from 'react';
import PropTypes from 'prop-types';

import Loader from '../common/Loader/Loader';

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
        let renderChildren = () => {
          if (!item.hasChildren || !item.isUnfolded) {
            return null;
          }

          if (item.isChildrenLoading) {
            return <Loader type="points" style={{ margin: 0 }} />;
          }

          return renderLevel(item.id);
        };

        return (
          <FolderTreeItem
            key={item.id}
            item={item}
            isSelected={item.id === selected}
            onSelect={onSelect}
            onUnfold={onUnfold}
            onFold={onFold}
          >
            {renderChildren()}
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
