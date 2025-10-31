import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import React, { useContext } from 'react';

import Grid from '../../../../grid/Grid';
import { TableFormContext } from '../../TableFormContext';

import InlineActions from './InlineActions';

import { t } from '@/helpers/util';

const List = React.memo(
  props => {
    const context = useContext(TableFormContext);

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
      noHeader,
      noHorizontalScroll
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
            inlineActions={rowId => <InlineActions rowId={rowId} context={context} />}
            className="ecos-table-form__grid"
            scrollable={false}
            noHeader={noHeader}
            noTopBorder={noHeader}
            noHorizontalScroll={noHorizontalScroll}
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
