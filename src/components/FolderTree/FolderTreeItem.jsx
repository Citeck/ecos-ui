import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import EcosIcon from '../common/EcosIcon';

import { ReactComponent as FolderImage } from './FolderImage.svg';

import './FolderTree.scss';

const FolderTreeItem = ({ children, item, isSelected, onSelect, onUnfold, onFold }) => {
  const { id, title, hasChildren, isUnfolded } = item;
  const _onSelect = () => typeof onSelect === 'function' && onSelect(id);
  const _onUnfold = () => typeof onUnfold === 'function' && onUnfold(id);
  const _onFold = () => typeof onFold === 'function' && onFold(id);

  return (
    <div className="ecos-folder-tree__item">
      <div className="ecos-folder-tree__fold-switch">
        {hasChildren && (
          <EcosIcon
            className="ecos-folder-tree__fold-switch-icon"
            data={{ value: isUnfolded ? 'icon-small-down' : 'icon-small-right' }}
            onClick={isUnfolded ? _onFold : _onUnfold}
          />
        )}
      </div>
      <div>
        <div className="ecos-folder-tree__item-body" onClick={_onSelect}>
          <FolderImage
            className={classNames('ecos-folder-tree__folder-image', {
              'ecos-folder-tree__folder-image_selected': isSelected
            })}
          />
          <span
            className={classNames('ecos-folder-tree__item-title', {
              'ecos-folder-tree__item-title_selected': isSelected
            })}
          >
            {title}
          </span>
        </div>
        <div className="ecos-folder-tree__item-children">{children}</div>
      </div>
    </div>
  );
};

const FolderTreeItemPropTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  parent: PropTypes.string,
  hasChildren: PropTypes.bool,
  isUnfolded: PropTypes.bool
};

FolderTreeItem.propTypes = {
  item: PropTypes.shape(FolderTreeItemPropTypes).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  onUnfold: PropTypes.func,
  onFold: PropTypes.func
};

export default FolderTreeItem;
export { FolderTreeItemPropTypes };
