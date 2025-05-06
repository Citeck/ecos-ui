import React, { useContext, useRef } from 'react';

import { TableFormContext } from '../../TableFormContext';
import CreateVariants from '../CreateVariants';
import ImportButton from '../ImportButton';
import SelectButton from '../SelectButton';
import List from './List';

import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);
  const {
    placeholder,
    viewOnly,
    isSelectableRows,
    nonSelectableRows,
    selectedRows,
    noColHeaders,
    noHorizontalScroll
  } = context.controlProps;
  const { gridRows, columns, error, onSelectGridItem } = context;
  const wrapperRef = useRef(null);

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
        noHeader={noColHeaders}
        noHorizontalScroll={noHorizontalScroll}
      />
      {!error && (
        <div className="ecos-table-form__buttons-wrapper">
          <ImportButton />
          <CreateVariants />
          <SelectButton />
        </div>
      )}
      {error && <p className="ecos-table-form__error">{error.message}</p>}
    </div>
  );
};

export default InputView;
