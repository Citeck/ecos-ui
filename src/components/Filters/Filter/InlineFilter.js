import React from 'react';
import classNames from 'classnames';

import Filter from './Filter';
import { IcoBtn } from '../../common/btns';

import './Filter.scss';
import './InlineFilter.scss';

class InlineFilter extends Filter {
  get valueClassNames() {
    return classNames(super.valueClassNames, 'ecos-inline-filter__value');
  }
  get selectorClassNames() {
    return classNames(super.selectorClassNames, 'ecos-inline-filter__selector');
  }

  handleConfirmAction = () => {
    this.props.onToggle();
  };

  renderConfirmAction() {
    const btnClasses = 'ecos-btn_i ecos-btn_transparent ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height';

    return (
      <IcoBtn
        icon="icon-small-check"
        className={classNames(btnClasses, 'ecos-inline-filter__actions-confirm')}
        onClick={this.handleConfirmAction}
      />
    );
  }

  render() {
    const { className, children } = this.props;

    return (
      <div className={classNames('ecos-inline-filter', className)}>
        {children}

        <div className="ecos-inline-filter__body">
          {this.renderSelector()}
          {this.renderValue()}
          <div className="ecos-inline-filter__actions">
            {this.renderDeleteAction()}
            {this.renderConfirmAction()}
          </div>
        </div>
      </div>
    );
  }
}

export default InlineFilter;
