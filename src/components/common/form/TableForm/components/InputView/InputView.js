import React, { useContext, useEffect, useRef } from 'react';

import { TableFormContext } from '../../TableFormContext';
import CreateVariants from '../CreateVariants';
import ImportButton from '../ImportButton';
import List from './List';

import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);
  const { placeholder, viewOnly, isSelectableRows, nonSelectableRows, selectedRows, noColHeaders } = context.controlProps;
  const { gridRows, columns, error, setInlineToolsOffsets, onSelectGridItem } = context;
  const wrapperRef = useRef(null);

  useEffect(() => {
    const resetInlineToolsOffsets = () => setInlineToolsOffsets({ height: 0, top: 0, row: {} });
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
        noHeader={noColHeaders}
      />
      {!error && (
        <div className="ecos-table-form__buttons-wrapper">
          <ImportButton />
          <CreateVariants />
        </div>
      )}
      {error && <p className="ecos-table-form__error">{error.message}</p>}
    </div>
  );
};

export default InputView;
