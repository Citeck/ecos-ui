import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from '../../../buttons/Button/Button';
import { t } from '../../../../../helpers/util';
import './InputView.scss';

class InputView extends Component {
  render() {
    const { value, placeholder, error, disabled, multiple, isCompact, editValue, deleteValue, openSelectModal } = this.props;

    const wrapperClasses = classNames('select-journal__input-view', {
      'select-journal__input-view_compact': isCompact
    });

    const buttonClasses = classNames('button_blue', {
      button_narrow: isCompact,
      'select-journal__input-view-button_compact': isCompact
    });

    const placeholderText = placeholder ? placeholder : t('select-journal.placeholder');

    const valuesList = isCompact ? (
      <Fragment>
        {value.length > 0 ? <div className={'select-journal__values-list_compact'}>{value.map(item => item.disp).join(',')}</div> : null}
      </Fragment>
    ) : (
      <Fragment>
        {value.length > 0 ? (
          <ul className={'select-journal__values-list'}>
            {value.map(item => (
              <li key={item.id}>
                <span className="select-journal__values-list-disp">{item.disp}</span>
                <div className="select-journal__values-list-actions">
                  <span data-id={item.id} className={'icon icon-edit'} onClick={editValue} />
                  <span data-id={item.id} className={'icon icon-delete'} onClick={deleteValue} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={'select-journal__value-not-selected'}>{placeholderText}</p>
        )}
      </Fragment>
    );

    return (
      <div className={wrapperClasses}>
        {isCompact ? null : valuesList}

        {error ? (
          <p className={'select-journal__error'}>{error.message}</p>
        ) : (
          <Button className={buttonClasses} onClick={openSelectModal} disabled={disabled}>
            {value.length > 0
              ? multiple
                ? t('select-journal.button.add')
                : t('select-journal.button.change')
              : t('select-journal.button.select')}
          </Button>
        )}

        {isCompact ? valuesList : null}
      </div>
    );
  }
}

InputView.propTypes = {
  value: PropTypes.array,
  placeholder: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func
};

export default InputView;
