import React from 'react';
import classNames from 'classnames';

import { Labels, PANEL_MENU_HEIGHT_MAX } from '@/helpers/documents';
import { t } from '@/helpers/util';
import { Search } from '@/components/common';
import { DropdownOuter } from '@/components/common/form';
import { Btn } from '@/components/common/btns';

export default React.memo(props => {
  const {
    allDocuments,
    isLoadingDownload,
    downloadAllDocuments,
    dynamicTypes,
    statusFilter,
    selectedType,
    typesStatuses,
    searchText,
    onSearch,
    onChangeFilter,
    renderUploadButton,
    forwardedRef,
    isMobile
  } = props;

  const loading = isLoadingDownload || allDocuments === null;
  const disabled = loading || (allDocuments && !allDocuments.length);

  return (
    <div ref={forwardedRef} className={classNames('ecos-docs__panel', { 'ecos-docs__panel_mobile': isMobile })}>
      {renderUploadButton()}
      <Search text={searchText} cleaner liveSearch searchWithEmpty onSearch={onSearch} className="ecos-docs__panel-search" />
      {!selectedType && dynamicTypes.length > 1 && (
        <DropdownOuter
          withScrollbar
          valueField="key"
          titleField="value"
          value={statusFilter}
          source={typesStatuses}
          className="ecos-docs__panel-filter"
          controlClassName="ecos-docs__panel-filter-control"
          onChange={onChangeFilter}
          scrollbarHeightMax={PANEL_MENU_HEIGHT_MAX}
        />
      )}
      <Btn loading={loading} disabled={disabled} onClick={() => downloadAllDocuments(allDocuments)}>
        {t(Labels.DOWNLOAD_ALL_DOCUMENTS)}
      </Btn>
    </div>
  );
});
