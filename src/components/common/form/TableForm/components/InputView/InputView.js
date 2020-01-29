import React, { useContext, useRef, useEffect } from 'react';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import { IcoBtn } from '../../../../../common/btns';
import Grid from '../../../../grid/Grid';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';
import CreateVariants from '../CreateVariants';
import { t } from '../../../../../../helpers/util';
import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);

  const { placeholder, disabled, viewOnly, displayElements, isSelectableRows } = context.controlProps;
  const {
    gridRows,
    selectedRows,
    columns,
    error,
    deleteSelectedItem,
    showEditForm,
    inlineToolsOffsets,
    setInlineToolsOffsets,
    showViewOnlyForm,
    onSelectGridItem
  } = context;

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

  const wrapperClasses = classNames('ecos-table-form__input-view');

  const placeholderText = placeholder ? placeholder : t('ecos-table-form.placeholder');

  const onClickDelete = () => {
    setInlineToolsOffsets({ height: 0, top: 0, row: {} });
    deleteSelectedItem(inlineToolsOffsets.rowId);
  };

  const onClickEdit = () => {
    showEditForm(inlineToolsOffsets.rowId);
  };

  const onClickView = () => {
    showViewOnlyForm(inlineToolsOffsets.rowId);
  };

  let valuesList = (
    <p
      className={classNames('ecos-table-form__value-not-selected', {
        'ecos-table-form__value-not-selected_view-only': viewOnly
      })}
    >
      {placeholderText}
    </p>
  );

  if (gridRows.length > 0) {
    const inlineTools = () => {
      const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10';
      const iconButtons = [];

      const shouldShowViewButton = isBoolean(get(displayElements, 'view')) ? displayElements.view : true;
      if (shouldShowViewButton) {
        iconButtons.push(<IcoBtn key={'view'} icon={'icon-on'} className={`${inlineToolsActionClassName} inline-tools-actions-btn__on`} onClick={onClickView} />);
      }

      const shouldShowEditButton = isBoolean(get(displayElements, 'edit')) ? displayElements.edit : !viewOnly;
      if (shouldShowEditButton) {
        iconButtons.push(<IcoBtn key={'edit'} icon={'icon-edit'} className={`${inlineToolsActionClassName} inline-tools-actions-btn__edit`} onClick={onClickEdit} />);
      }

      const shouldShowDeleteButton = isBoolean(get(displayElements, 'delete')) ? displayElements.delete : !disabled && !viewOnly;
      if (shouldShowDeleteButton) {
        iconButtons.push(<IcoBtn key={'delete'} icon={'icon-delete'} className={`${inlineToolsActionClassName} inline-tools-actions-btn__delete`} onClick={onClickDelete} />);
      }

      return <InlineToolsDisconnected {...inlineToolsOffsets} tools={iconButtons} />;
    };

    valuesList = (
      <div ref={wrapperRef} className={'ecos-table-form__grid-wrapper'}>
        <Grid
          data={gridRows}
          columns={columns}
          total={gridRows.length}
          singleSelectable={false}
          multiSelectable={!viewOnly && isSelectableRows}
          onSelect={onSelectGridItem}
          selected={selectedRows}
          inlineTools={inlineTools}
          onChangeTrOptions={setInlineToolsOffsets}
          className={'ecos-table-form__grid'}
          scrollable={false}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {valuesList}

      {error ? <p className={'ecos-table-form__error'}>{error.message}</p> : <CreateVariants />}
    </div>
  );
};

InputView.propTypes = {};

export default InputView;
