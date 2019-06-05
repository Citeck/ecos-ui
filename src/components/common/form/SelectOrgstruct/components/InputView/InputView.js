import React, { useContext, Fragment } from 'react';
import classNames from 'classnames';
import { Btn } from '../../../../../common/btns';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { t } from '../../../../../../helpers/util';
import './InputView.scss';

const InputView = () => {
  const context = useContext(SelectOrgstructContext);

  const { isCompact, disabled, multiple, placeholder } = context.controlProps;
  const { selectedRows, error, toggleSelectModal, deleteSelectedItem } = context;

  const wrapperClasses = classNames('select-orgstruct__input-view', {
    'select-orgstruct__input-view_compact': isCompact
  });

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': true, //isCompact,
    'select-orgstruct__input-view-button_compact': isCompact
  });

  const placeholderText = placeholder ? placeholder : t('select-orgstruct.placeholder');

  const onClickDelete = e => {
    deleteSelectedItem(e.target.dataset.id);
  };

  const valuesList = isCompact ? (
    <Fragment>
      {selectedRows.length > 0 ? (
        <div className={'select-orgstruct__values-list_compact'}>{selectedRows.map(item => item.label).join(', ')}</div>
      ) : null}
    </Fragment>
  ) : (
    <Fragment>
      {selectedRows.length > 0 ? (
        <ul className={'select-orgstruct__values-list'}>
          {selectedRows.map(item => (
            <li key={item.id}>
              <span className="select-orgstruct__values-list-disp">{item.label}</span>
              <div className="select-orgstruct__values-list-actions">
                {/*<span data-id={item.id} className={'icon icon-edit'} onClick={() => {}} />*/}
                <span data-id={item.id} className={'icon icon-delete'} onClick={onClickDelete} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={'select-orgstruct__value-not-selected'}>{placeholderText}</p>
      )}
    </Fragment>
  );

  return (
    <div className={wrapperClasses}>
      {isCompact ? null : valuesList}

      {error ? (
        <p className={'select-orgstruct__error'}>{error.message}</p>
      ) : (
        <Btn className={buttonClasses} onClick={toggleSelectModal} disabled={disabled}>
          {selectedRows.length > 0
            ? multiple
              ? t('select-orgstruct.button.add')
              : t('select-orgstruct.button.change')
            : t('select-orgstruct.button.select')}
        </Btn>
      )}

      {isCompact ? valuesList : null}
    </div>
  );
};

InputView.propTypes = {};

export default InputView;
