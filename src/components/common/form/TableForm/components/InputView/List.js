import React from 'react';
import classNames from 'classnames';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';

import { t } from '../../../../../../helpers/export/util';
import Grid from '../../../../grid/Grid';
import InlineActions from './InlineActions';

const List = React.memo(
  props => {
    const {
      wrapperRef,
      viewOnly,
      placeholder,
      gridRows = [],
      columns,
      isSelectableRows,
      onSelectGridItem,
      selectedRows,
      nonSelectableRows,
      setInlineToolsOffsets,
      noHeader
    } = props;
    const placeholderText = placeholder ? placeholder : t('ecos-table-form.placeholder');
    const rowsIds = gridRows.map(i => i.id);

    return (
      <>
        <div ref={wrapperRef} className="ecos-table-form__grid-wrapper" hidden={!gridRows.length}>
          <Grid
            data={gridRows}
            columns={columns}
            total={gridRows.length}
            singleSelectable={false}
            multiSelectable={!viewOnly && isSelectableRows}
            onSelect={onSelectGridItem}
            selected={selectedRows}
            nonSelectable={nonSelectableRows.filter(item => rowsIds.includes(item))}
            inlineTools={() => <InlineActions />}
            onChangeTrOptions={setInlineToolsOffsets}
            className="ecos-table-form__grid"
            scrollable={false}
            noHeader={noHeader}
            noTopBorder={noHeader}
          />
        </div>
        {!gridRows.length && (
          <p className={classNames('ecos-table-form__value-not-selected', { 'ecos-table-form__value-not-selected_view-only': viewOnly })}>
            {placeholderText}
          </p>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      isEqualWith(nextProps.columns, prevProps.columns, isEqual) &&
      isEqualWith(nextProps.gridRows, prevProps.gridRows, isEqual) &&
      isEqual(nextProps.selectedRows, prevProps.selectedRows) &&
      isEqual(nextProps.nonSelectableRows, prevProps.nonSelectableRows) &&
      nextProps.isSelectableRows === prevProps.isSelectableRows
    );
  }
);

export default List;
