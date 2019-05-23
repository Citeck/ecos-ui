import React, { useContext, Fragment } from 'react';
import classNames from 'classnames';
import { Btn } from '../../../../../common/btns';
import { TableFormContext } from '../../TableFormContext';
import { t } from '../../../../../../helpers/util';
import './InputView.scss';

const InputView = () => {
  const context = useContext(TableFormContext);

  const { isCompact, disabled, placeholder } = context.controlProps;
  const { selectedRows, error, deleteSelectedItem, showCreateForm, showEditForm } = context;

  const wrapperClasses = classNames('ecos-table-form__input-view');

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': isCompact
  });

  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  const onClickDelete = e => {
    deleteSelectedItem(e.target.dataset.id);
  };

  const onClickEdit = e => {
    showEditForm(e.target.dataset.id);
  };

  const valuesList = (
    <Fragment>
      {selectedRows.length > 0 ? (
        <ul>
          {selectedRows.map(item => (
            <li key={item.id}>
              <span>{item.id}</span>
              <div>
                <span data-id={item.id} className={'icon icon-edit'} onClick={onClickEdit} />
                <span data-id={item.id} className={'icon icon-delete'} onClick={onClickDelete} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={'ecos-table-form__value-not-selected'}>{placeholderText}</p>
      )}
    </Fragment>
  );

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
