import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import PageTabList from '../../../../../services/pageTabs/PageTabListService';
import { Btn } from '../../../../common/btns';

import './InputView.scss';

class InputView extends Component {
  stopBlur = false;

  onBlur = () => {
    const { onBlur } = this.props;

    if (!this.stopBlur && typeof onBlur === 'function') {
      onBlur.call(this);
    }
  };

  onClick = () => {
    const { openSelectModal } = this.props;

    if (typeof openSelectModal === 'function') {
      this.stopBlur = true;
      openSelectModal.call(this);
    }
  };

  renderSelectedValue(item) {
    const { isSelectedValueAsLink } = this.props;
    const url = createDocumentUrl(item.id);
    const onClick = () => {
      if (isSelectedValueAsLink) {
        PageTabList.changeUrlLink(url, { openNewBrowserTab: true });
      }
    };

    return (
      <span
        onClick={onClick}
        className={classNames('select-journal__values-list-disp', { 'select-journal__values-list-disp_link': isSelectedValueAsLink })}
      >
        {item.disp}
      </span>
    );
  }

  render() {
    const {
      selectedRows,
      placeholder,
      error,
      disabled,
      multiple,
      isCompact,
      editValue,
      deleteValue,
      className,
      autoFocus,
      hideEditRowButton,
      hideDeleteRowButton
    } = this.props;

    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);

    const buttonClasses = classNames('ecos-btn_blue', {
      'ecos-btn_narrow': true,
      'select-journal__input-view-button_compact': isCompact
    });

    const placeholderText = placeholder ? placeholder : t('select-journal.placeholder');

    const valuesList = isCompact ? (
      <>
        {selectedRows.length > 0 && (
          <div className="select-journal__values-list_compact">{selectedRows.map(item => item.disp).join(', ')}</div>
        )}
      </>
    ) : (
      <>
        {selectedRows.length > 0 ? (
          <ul className="select-journal__values-list">
            {selectedRows.map(item => (
              <li key={item.id}>
                {this.renderSelectedValue(item)}
                {disabled ? null : (
                  <div className="select-journal__values-list-actions">
                    {!(!item.canEdit || hideEditRowButton) && <span data-id={item.id} className="icon icon-edit" onClick={editValue} />}
                    {!hideDeleteRowButton && <span data-id={item.id} className="icon icon-delete" onClick={deleteValue} />}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="select-journal__value-not-selected">{placeholderText}</p>
        )}
      </>
    );

    return (
      <div className={wrapperClasses}>
        {isCompact ? null : valuesList}

        {error ? (
          <p className="select-journal__error">{error.message}</p>
        ) : (
          <Btn className={buttonClasses} onClick={this.onClick} disabled={disabled} autoFocus={autoFocus} onBlur={this.onBlur}>
            {selectedRows.length > 0
              ? multiple
                ? t('select-journal.button.add')
                : t('select-journal.button.change')
              : t('select-journal.button.select')}
          </Btn>
        )}

        {isCompact ? valuesList : null}
      </div>
    );
  }
}

InputView.propTypes = {
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  isSelectedValueAsLink: PropTypes.bool
};

export default InputView;
