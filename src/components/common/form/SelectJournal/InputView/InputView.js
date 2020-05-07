import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import { Btn } from '../../../../common/btns';
import { TableForm } from '../../../../common/form';
import { Grid } from '../../../../common/grid';
import { AssocLink } from '../../AssocLink';

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
    const { isSelectedValueAsText, isInlineEditingMode } = this.props;
    const props = {};

    if (!isSelectedValueAsText) {
      props.link = createDocumentUrl(item.id);
      props.paramsLink = { openNewBrowserTab: !isInlineEditingMode };
    }

    return <AssocLink label={item.disp} asText={isSelectedValueAsText} {...props} className="select-journal__values-list-disp" />;
  }

  renderCompactList = () => {
    const { selectedRows, isCompact } = this.props;

    if (!isCompact) {
      return null;
    }

    return (
      <>
        {selectedRows.length > 0 && (
          <div className="select-journal__values-list_compact">{selectedRows.map(item => item.disp).join(', ')}</div>
        )}
      </>
    );
  };

  renderList = () => {
    const {
      viewMode,
      disabled,
      isCompact,
      editValue,
      placeholder,
      deleteValue,
      selectedRows,
      hideEditRowButton,
      hideDeleteRowButton,
      gridData
    } = this.props;

    if (isCompact) {
      return null;
    }

    if (!selectedRows.length) {
      return <p className="select-journal__value-not-selected">{placeholder ? placeholder : t('select-journal.placeholder')}</p>;
    }

    if (viewMode === 'table') {
      // return <Grid {...gridData}/>;
      return <TableForm {...gridData} />;
    }

    return (
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
    );
  };

  render() {
    const { selectedRows, error, disabled, multiple, isCompact, className, autoFocus } = this.props;

    const wrapperClasses = classNames('select-journal__input-view', { 'select-journal__input-view_compact': isCompact }, className);

    const buttonClasses = classNames('ecos-btn_blue', {
      'ecos-btn_narrow': true,
      'select-journal__input-view-button_compact': isCompact
    });

    return (
      <div className={wrapperClasses}>
        {this.renderList()}

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

        {this.renderCompactList()}
      </div>
    );
  }
}

InputView.propTypes = {
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  viewMode: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  isInlineEditingMode: PropTypes.bool
};

export default InputView;
