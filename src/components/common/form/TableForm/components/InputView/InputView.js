import React, { useContext, useEffect, useRef } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { t } from '../../../../../../helpers/util';
import Grid from '../../../../grid/Grid';
import { TableFormContext } from '../../TableFormContext';
import CreateVariants from '../CreateVariants';
import ImportButton from '../ImportButton';
import InlineActions from './InlineActions';

import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);
  const { placeholder, viewOnly, isSelectableRows, nonSelectableRows, selectedRows } = context.controlProps;
  const { gridRows, columns, error, setInlineToolsOffsets, onSelectGridItem } = context;
  const wrapperRef = useRef(null);

  useEffect(() => {
    const resetInlineToolsOffsets = () => {
      setInlineToolsOffsets({ height: 0, top: 0, row: {} });
    };

    const gridWrapper = wrapperRef.current;
    if (gridWrapper) {
      gridWrapper.addEventListener('mouseleave', resetInlineToolsOffsets);
    }
    return () => {
      if (gridWrapper) {
        gridWrapper.removeEventListener('mouseleave', resetInlineToolsOffsets);
      }
    };
  }, [wrapperRef.current, setInlineToolsOffsets]);

  return (
    <div className="ecos-table-form__input-view">
      <List
        wrapperRef={wrapperRef}
        viewOnly={viewOnly}
        placeholder={placeholder}
        gridRows={gridRows}
        columns={columns}
        isSelectableRows={isSelectableRows}
        onSelectGridItem={onSelectGridItem}
        selectedRows={selectedRows}
        nonSelectableRows={nonSelectableRows}
        setInlineToolsOffsets={setInlineToolsOffsets}
      />
      {!error && (
        <div className={'ecos-table-form__buttons-wrapper'}>
          <ImportButton />
          <CreateVariants />
        </div>
      )}
      {error && <p className={'ecos-table-form__error'}>{error.message}</p>}
    </div>
  );
};

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
      setInlineToolsOffsets
    } = props;
    const placeholderText = placeholder ? placeholder : t('ecos-table-form.placeholder');

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
            nonSelectable={nonSelectableRows}
            inlineTools={() => <InlineActions />}
            onChangeTrOptions={setInlineToolsOffsets}
            className="ecos-table-form__grid"
            scrollable={false}
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
      isEqual(nextProps.columns, prevProps.columns) &&
      isEqual(nextProps.gridRows, prevProps.gridRows) &&
      isEqual(nextProps.selectedRows, prevProps.selectedRows) &&
      isEqual(nextProps.nonSelectableRows, prevProps.nonSelectableRows) &&
      nextProps.isSelectableRows === prevProps.isSelectableRows
    );
  }
);

export default InputView;
