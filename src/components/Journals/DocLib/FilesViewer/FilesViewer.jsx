import React, { useEffect } from 'react';
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
  isLoading
}) => {
  const { hasError, isReady, items = [], selected, lastClicked } = fileViewer;

  let content;

  useEffect(() => {
    DocLibService.emitter.on(DocLibService.actionSuccessCallback, onInitData);

    return () => {
      DocLibService.emitter.off(DocLibService.actionSuccessCallback, onInitData);
    };
  }, []);

  if (hasError) {
    content = t('document-library.failure-to-fetch-data');
  } else if (!isReady) {
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
            onDrop={onDrop}
          />
        </div>
      ) : (
        <Empty onDrop={onDrop} />
      );
  }

  return (
    <Well className="ecos-doclib__fileviewer-well">
      {isLoading && <Loader blur rounded />}
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
  groupActions: PropTypes.shape({
    isReady: PropTypes.bool,
    forRecords: PropTypes.shape({
      actions: PropTypes.array
    })
  }),
  path: PropTypes.array
};

export default FilesViewer;
