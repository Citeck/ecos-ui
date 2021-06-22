import React from 'react';
import classNames from 'classnames';

import Filter from './Filter';

import './InlineFilter.scss';

class InlineFilter extends Filter {
  get valueClassNames() {
    return classNames(super.selectorClassNames, 'ecos-inline-filter__value');
  }

  render() {
    const { className, children } = this.props;

    return (
      <div className={classNames('ecos-inline-filter', className)}>
        {children}

        <div className="ecos-inline-filter__body">
          {this.renderSelector()}
          {this.renderValue()}
          {this.renderDeleteAction()}
        </div>
      </div>
    );
  }
}

export default InlineFilter;
