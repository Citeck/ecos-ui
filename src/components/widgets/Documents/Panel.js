import React from 'react';
import classNames from 'classnames';

import { Search } from '../../common';
import { Dropdown } from '../../common/form';

export default React.memo(props => {
  const {
    dynamicTypes,
    statusFilter,
    selectedType,
    typesStatuses,
    searchText,
    onSearch,
    onChangeFilter,
    renderUploadButton,
    forwardedRef,
    scrollbarHeightMax,
    isMobile
  } = props;

  return (
    <div ref={forwardedRef} className={classNames('ecos-docs__panel', { 'ecos-docs__panel_mobile': isMobile })}>
      {renderUploadButton()}
      <Search text={searchText} cleaner liveSearch searchWithEmpty onSearch={onSearch} className="ecos-docs__panel-search" />
      {!selectedType && dynamicTypes.length > 1 && (
        <Dropdown
          withScrollbar
          valueField="key"
          titleField="value"
          value={statusFilter}
          source={typesStatuses}
          className="ecos-docs__panel-filter"
          controlClassName="ecos-docs__panel-filter-control"
          onChange={onChangeFilter}
          scrollbarHeightMax={scrollbarHeightMax}
        />
      )}
    </div>
  );
});
