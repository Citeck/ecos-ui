import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EcosModal from '../../EcosModal/EcosModal';
import { Btn } from '../../btns';
import { t, trigger } from '../../../../helpers/util';

import './RemoveDialog.scss';

class RemoveDialog extends Component {
  onClose = () => {
    trigger.call(this, 'onClose');
  };

  onCancel = () => {
    trigger.call(this, 'onCancel');
  };

  onDelete = () => {
    trigger.call(this, 'onDelete');
  };

  render() {
    const { className, bodyClassName, footerClassName, title, isOpen, text, isLoading } = this.props;

    const cssClasses = classNames('ecos-remove-dialog', className, { 'ecos-modal_width-sm': !className.includes('ecos-modal_width-') });
    const bodyCssClasses = classNames('ecos-remove-dialog__body', bodyClassName);
    const footerCssClasses = classNames('ecos-remove-dialog__footer', footerClassName);

    return (
      <EcosModal title={title} isOpen={isOpen} isLoading={isLoading} hideModal={this.onClose} className={cssClasses}>
        <div className={bodyCssClasses}>{text}</div>

        <div className={footerCssClasses}>
          <Btn onClick={this.onCancel}>{t('journals.action.cancel')}</Btn>

          <Btn onClick={this.onDelete} className={'ecos-btn_red'}>
            {t('journals.action.delete')}
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
