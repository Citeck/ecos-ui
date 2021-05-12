import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import moment from 'moment';

import { ActionPropTypes } from '../common/grid/InlineTools/constants';
import { renderAction } from '../common/grid/InlineTools/helpers';
import EcosIcon from '../common/EcosIcon';
import FileIcon from '../common/FileIcon';
import { detectFormat } from '../common/FileIcon/helpers';
import { NODE_TYPES } from '../../constants/docLib';

const DATE_FORMAT = 'DD.MM.YYYY HH:mm';

const FilesViewerItem = ({ item, isSelected, isLastClicked, isMobile, onClick, onDoubleClick, onDrop }) => {
  const { title, type, modified, actions } = item;
  const _onClick = e => typeof onClick === 'function' && onClick(item, e);
  const _onDoubleClick = e => typeof onDoubleClick === 'function' && onDoubleClick(item, e);
  const _onDrop = e => {
    if (typeof onDrop !== 'function') {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const dataTypes = get(e, 'dataTransfer.types', []);

    console.warn({ e, dataTypes, files: Array.from(e.dataTransfer.files) });

    if (!dataTypes.includes('Files')) {
      return;
    }

    onDrop({ item, files: Array.from(e.dataTransfer.files) });
  };
  const _onDragOver = e => {
    e.stopPropagation();
    e.preventDefault();
  };
  const _onDragEnter = e => {
    e.stopPropagation();
  };

  let modifiedDisp = '-';
  if (modified) {
    const date = moment(modified);
    if (date.isValid()) {
      modifiedDisp = date.format(DATE_FORMAT);
    }
  }

  const actionsList = (actions || []).map((action, idx) => renderAction(action, idx));

  return (
    <div
      className={classNames('ecos-files-viewer__item', {
        'ecos-files-viewer__item_selected': isSelected,
        'ecos-files-viewer__item_lastclicked': isLastClicked,
        'ecos-files-viewer__item_mobile': isMobile
      })}
      onClick={_onClick}
      onDoubleClick={_onDoubleClick}
      onDrop={_onDrop}
      onDragOver={_onDragOver}
      onDragEnter={_onDragEnter}
    >
      <div className="ecos-files-viewer__item-left">
        <div className="ecos-files-viewer__item-icon-wrapper">
          {type === NODE_TYPES.DIR ? (
            <EcosIcon className={classNames('ecos-files-viewer__item-icon')} data={{ value: 'icon-folder' }} />
          ) : (
            <FileIcon className={classNames('ecos-files-viewer__item-file-icon')} format={detectFormat(title)} />
          )}
        </div>
        <span className="ecos-files-viewer__item-title" title={title}>
          {title}
        </span>
      </div>
      <div
        className={classNames('ecos-files-viewer__item-right', {
          'ecos-files-viewer__item-right_mobile': isMobile
        })}
      >
        <span className="ecos-files-viewer__item-modified" title={modifiedDisp}>
          {modifiedDisp}
        </span>
        <div className="ecos-files-viewer__item-actions">{actionsList}</div>
      </div>
    </div>
  );
};

const FilesViewerItemPropTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(NODE_TYPES)),
  modified: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.shape(ActionPropTypes))
};

FilesViewerItem.propTypes = {
  item: PropTypes.shape(FilesViewerItemPropTypes).isRequired,
  isSelected: PropTypes.bool,
  isLastClicked: PropTypes.bool,
  isMobile: PropTypes.bool,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onDrop: PropTypes.func
};

export default FilesViewerItem;
export { FilesViewerItemPropTypes };
