import React, { useContext, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Btn, IcoBtn } from '../../../../../common/btns';
import Grid from '../../../../grid/Grid';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';
import { t } from '../../../../../../helpers/util';
import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);

  const { isCompact, disabled, placeholder } = context.controlProps;
  const {
    selectedRows,
    columns,
    error,
    deleteSelectedItem,
    showCreateForm,
    showEditForm,
    inlineToolsOffsets,
    setInlineToolsOffsets
  } = context;

  const wrapperRef = useRef(null);

  useEffect(() => {
    const resetInlineToolsOffsets = () => {
      setInlineToolsOffsets(null, { height: 0, top: 0, row: {} });
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

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': isCompact
  });

  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  const onClickDelete = () => {
    setInlineToolsOffsets(null, { height: 0, top: 0, row: {} });
    deleteSelectedItem(inlineToolsOffsets.rowId);
  };

  const onClickEdit = () => {
    showEditForm(inlineToolsOffsets.rowId);
  };

  let valuesList = <p className={'ecos-table-form__value-not-selected'}>{placeholderText}</p>;
  if (selectedRows.length > 0) {
    const inlineTools = () => {
      const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10';

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
          onMouseEnter={setInlineToolsOffsets}
          className={'ecos-table-form__grid'}
        />
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {valuesList}

      {error ? (
        <p className={'ecos-table-form__error'}>{error.message}</p>
      ) : (
        <Btn className={buttonClasses} onClick={showCreateForm} disabled={disabled}>
          {t('select-journal.select-modal.create-button')}
        </Btn>
      )}
    </div>
  );
};

InputView.propTypes = {};

export default InputView;
