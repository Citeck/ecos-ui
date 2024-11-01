import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';

import { ActionPropTypes } from '../common/grid/InlineTools/constants';
import { renderAction } from '../common/grid/InlineTools/helpers';
import EcosIcon from '../common/EcosIcon';
import FileIcon from '../common/FileIcon';
import { detectFormat } from '../common/FileIcon/helpers';
import { NODE_TYPES } from '../../constants/docLib';
import { useDropFile } from '../../hooks';

const DATE_FORMAT = 'DD.MM.YYYY HH:mm';

const FilesViewerItem = ({ item, isSelected, isLastClicked, isMobile, onClick, onDoubleClick, onDrop }) => {
  const { title, type, modified, actions, isEmpty = false } = item;
  const {
    flags: { isAboveDir },
    handlers
  } = useDropFile({ item, callback: onDrop });
  let extraProps = {};

  if (typeof onDrop === 'function') {
    extraProps = {
      ...extraProps,
      ...handlers
    };
  }

  const _onClick = e => typeof onClick === 'function' && onClick(item, e);
  const _onDoubleClick = e => typeof onDoubleClick === 'function' && onDoubleClick(item, e);

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
        'ecos-files-viewer__item_selected': isSelected || isAboveDir,
        'ecos-files-viewer__item_lastclicked': isLastClicked,
        'ecos-files-viewer__item_mobile': isMobile,
        'ecos-files-viewer__item_empty': isEmpty
      })}
      onClick={_onClick}
      onDoubleClick={_onDoubleClick}
      {...extraProps}
    >
      {!isEmpty && (
        <>
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
        </>
      )}
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
