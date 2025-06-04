import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import EcosModal from '../../EcosModal/EcosModal';
import { Btn } from '../../btns';

import { t } from '@/helpers/util';

import './RemoveDialog.scss';

class RemoveDialog extends Component {
  onClose = () => {
    const { onClose } = this.props;

    isFunction(onClose) && onClose();
  };

  onCancel = () => {
    const { onCancel } = this.props;

    isFunction(onCancel) && onCancel();
  };

  onDelete = () => {
    const { onDelete } = this.props;

    isFunction(onDelete) && onDelete();
  };

  render() {
    const { className, bodyClassName, footerClassName, title, isOpen, text, isLoading, cancelText, confirmText, dialogRef } = this.props;

    const cssClasses = classNames('ecos-remove-dialog', className, { 'ecos-modal_width-sm': !className.includes('ecos-modal_width-') });
    const bodyCssClasses = classNames('ecos-remove-dialog__body', bodyClassName);
    const footerCssClasses = classNames('ecos-remove-dialog__footer', footerClassName);

    return (
      <EcosModal
        title={title}
        isOpen={isOpen}
        isLoading={isLoading}
        hideModal={this.onClose}
        className={cssClasses}
        autoFocus
        isPriorityModal
      >
        <div ref={dialogRef} className={bodyCssClasses}>
          {text}
        </div>

        <div className={footerCssClasses}>
          <Btn onClick={this.onCancel}>{cancelText || t('journals.action.cancel')}</Btn>

          <Btn onClick={this.onDelete} className="ecos-btn_red fitnesse-ecos-remove-dialog__btn_confirm">
            {confirmText || t('journals.action.delete')}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

RemoveDialog.propTypes = {
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.any,
  isOpen: PropTypes.bool
};

RemoveDialog.defaultProps = {
  className: '',
  bodyClassName: '',
  footerClassName: '',
  title: '',
  text: '',
  isOpen: false
};

export default RemoveDialog;
