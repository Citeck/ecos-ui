import React from 'react';

import { Search } from '../../common';
import { Dropdown } from '../../common/form';

export default React.memo(props => {
  const {
    dynamicTypes,
    statusFilter,
    selectedType,
    typesStatuses,
    tableFilter,
    onSearch,
    onChangeFilter,
    renderUploadButton,
    forwardedRef,
    scrollbarHeightMax
  } = props;

  return (
    <div ref={forwardedRef} className="ecos-docs__panel">
      {renderUploadButton()}
      <Search text={tableFilter} cleaner liveSearch searchWithEmpty onSearch={onSearch} className="ecos-docs__panel-search" />
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
