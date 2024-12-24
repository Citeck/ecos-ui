import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { Well } from '../../../common/form';
import Loader from '../../../common/Loader/Loader';
import { t } from '../../../../helpers/export/util';

import FileList from './FileList';
import Empty from './Empty';
import DocLibService from '../DocLibService';

import './FileViewer.scss';

const FilesViewer = ({
  isMobile,
  fileViewer = {},
  openFolder,
  setSelected,
  setLastClicked,
  groupActions = {},
  path = [],
  onInitData,
  onDrop,
  isLoading,
  setParentItem
}) => {
  const [isDragged, setIsDragged] = useState(false);
  const { hasError, isReady, items = [], selected, lastClicked } = fileViewer;

  let content;

  useEffect(() => {
    DocLibService.emitter.on(DocLibService.actionSuccessCallback, onInitData);

    return () => {
      DocLibService.emitter.off(DocLibService.actionSuccessCallback, onInitData);
    };
  }, []);

  const onDragEnter = e => {
    e.stopPropagation();
    e.preventDefault();

    if (e.currentTarget.contains(e.target)) {
      setIsDragged(true);
    }
  };
  const onDragOver = e => {
    e.stopPropagation();
    e.preventDefault();

    setIsDragged(true);
  };
  const onDragLeave = e => {
    e.stopPropagation();
    e.preventDefault();

    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragged(false);
    }
  };

  const _onDrop = (...args) => {
    onDrop(...args);

    setIsDragged(false);
  };

  const _setParentItem = (...args) => {
    setParentItem(...args);

    setIsDragged(false);
  };

  if (hasError) {
    content = t('document-library.failure-to-fetch-data');
  } else if (!isReady && !items.length) {
    content = <Loader blur rounded style={{ position: 'relative', margin: '0.5em 0' }} />;
  } else {
    const isGroupActionsReady = get(groupActions, 'isReady', false);
    const forRecords = get(groupActions, 'forRecords', {});
    const isGroupActionsVisible = !isGroupActionsReady || !isEmpty(forRecords.actions);
    const isBreadcrumbsVisible = !isEmpty(path);

    content =
      items.length > 0 ? (
        <div
          className={classNames('ecos-doclib__fileviewer', {
            'ecos-doclib__fileviewer_mobile': isMobile,
            'ecos-doclib__fileviewer_height-bc': isBreadcrumbsVisible && !isGroupActionsVisible,
            'ecos-doclib__fileviewer_height-ga': !isBreadcrumbsVisible && isGroupActionsVisible,
            'ecos-doclib__fileviewer_height-bc-ga': isBreadcrumbsVisible && isGroupActionsVisible
          })}
        >
          <FileList
            isMobile={isMobile}
            items={items}
            selected={selected}
            lastClicked={lastClicked}
            openFolder={openFolder}
            setSelected={setSelected}
            setLastClicked={setLastClicked}
            isDragged={isDragged}
            onDrop={_onDrop}
            setParentItem={_setParentItem}
          />
        </div>
      ) : (
        <Empty onDrop={_onDrop} />
      );
  }

  return (
    <Well
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      className={classNames('ecos-doclib__fileviewer-well', { 'ecos-doclib__fileviewer_dragged': isDragged })}
    >
      {(isLoading || !isReady) && <Loader blur rounded />}
      {content}
    </Well>
  );
};

FilesViewer.propTypes = {
  stateId: PropTypes.string,
  isMobile: PropTypes.bool,
  fileViewer: PropTypes.shape({
    hasError: PropTypes.bool,
    isReady: PropTypes.bool,
    items: PropTypes.array
  }),
  openFolder: PropTypes.func,
  setSelected: PropTypes.func,
  setParentItem: PropTypes.func,
  groupActions: PropTypes.shape({
    isReady: PropTypes.bool,
    forRecords: PropTypes.shape({
      actions: PropTypes.array
    })
  }),
  path: PropTypes.array
};

export default FilesViewer;
