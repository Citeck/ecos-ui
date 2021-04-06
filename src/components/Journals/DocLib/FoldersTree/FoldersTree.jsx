import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Well } from '../../../common/form';
import { PanelBar } from '../../../common';
import Loader from '../../../common/Loader/Loader';
import FolderTree from '../../../FolderTree';
import { t } from '../../../../helpers/export/util';
import { compareAZ } from '../../../../helpers/docLib';

import './FoldersTree.scss';

const FoldersTree = ({ hasError, isReady, isMobile, items, selected, onSelect, onUnfold, onFold }) => {
  let content;

  if (hasError) {
    content = t('document-library.failure-to-fetch-data');
  } else if (!isReady) {
    content = <Loader blur rounded style={{ position: 'relative', margin: '0.5em 0' }} />;
  } else {
    content =
      items.length > 0 ? (
        <div
          className={classNames('document-library-folders__container', {
            'document-library-folders__container_mobile': isMobile
          })}
        >
          <FolderTree items={items.sort(compareAZ)} selected={selected} onSelect={onSelect} onUnfold={onUnfold} onFold={onFold} />
        </div>
      ) : (
        t('document-library.no-folders')
      );
  }

  return (
    <Well className="ecos-journal-menu__folders-tree document-library-folders">
      <PanelBar
        open={true}
        header={t('document-library.folders-panel.title')}
        css={{
          headerClassName: 'panel-bar__header_full panel-bar__header_narrow ',
          headerLabelClassName: 'panel-bar__header-label_narrow panel-bar__header-label_bold',
          contentClassName: 'collapsible-list_panel-bar-header'
        }}
      >
        {content}
      </PanelBar>
    </Well>
  );
};

FoldersTree.propTypes = {
  stateId: PropTypes.string,
  hasError: PropTypes.bool,
  isReady: PropTypes.bool,
  isMobile: PropTypes.bool,
  items: PropTypes.array,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  onUnfold: PropTypes.func,
  onFold: PropTypes.func,
  closeMenu: PropTypes.func
};

export default FoldersTree;
