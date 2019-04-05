import React, { Component } from 'react';
import classNames from 'classnames';

import './FiltersCondition.scss';

export default class FiltersCondition extends Component {
  render() {
    const { className, cross, title } = this.props;

    return <span className={classNames('ecos-filters-condition', cross && 'ecos-filters-condition_cross', className)}>{title}</span>;
  }
}
