import React, { Component } from 'react';
import classNames from 'classnames';
import EcosModal from '../../EcosModal/EcosModal';
import { Btn } from '../../btns';
import { t, trigger } from '../../../../helpers/util';

import './RemoveDialog.scss';

export default class RemoveDialog extends Component {
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
    const { className, bodyClassName, footerClassName, title, isOpen, text } = this.props;

    const cssClasses = classNames('ecos-remove-dialog ecos-modal_width-sm', className);
    const bodyCssClasses = classNames('ecos-remove-dialog__body', bodyClassName);
    const footerCssClasses = classNames('ecos-remove-dialog__footer', footerClassName);

    return (
      <EcosModal title={title} isOpen={isOpen} hideModal={this.onClose} className={cssClasses}>
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
