import React, { useContext, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { IcoBtn } from '../../../../../common/btns';
import Grid from '../../../../grid/Grid';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';
import CreateVariants from '../CreateVariants';
import { t } from '../../../../../../helpers/util';
import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);

  const { placeholder, disabled, viewOnly } = context.controlProps;
  const { selectedRows, columns, error, deleteSelectedItem, showEditForm, inlineToolsOffsets, setInlineToolsOffsets } = context;

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

  let valuesList = (
    <p
      className={classNames('ecos-table-form__value-not-selected', {
        'ecos-table-form__value-not-selected_view-only': viewOnly
      })}
    >
      {placeholderText}
    </p>
  );

  if (selectedRows.length > 0) {
    const inlineTools =
      disabled || viewOnly
        ? null
        : () => {
            const inlineToolsActionClassName =
              'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10';

            return (
              <InlineToolsDisconnected
                {...inlineToolsOffsets}
                tools={[
                  <IcoBtn key={'edit'} icon={'icon-edit'} className={inlineToolsActionClassName} onClick={onClickEdit} />,
                  <IcoBtn key={'delete'} icon={'icon-delete'} className={inlineToolsActionClassName} onClick={onClickDelete} />
                ]}
              />
            );
          };

    valuesList = (
      <div ref={wrapperRef} className={'ecos-table-form__grid-wrapper'}>
        <Grid
          data={selectedRows}
          columns={columns}
          total={selectedRows.length}
          singleSelectable={false}
          multiSelectable={false}
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
