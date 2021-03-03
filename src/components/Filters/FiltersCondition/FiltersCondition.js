import React, { Component } from 'react';
import classNames from 'classnames';
import { trigger } from '../../../helpers/util';

import './FiltersCondition.scss';

export default class FiltersCondition extends Component {
  onClick = () => {
    const { index } = this.props;
    const condition = this.getCondition(true).value;

    trigger.call(this, 'onClick', { condition, index });
  };

  getCondition = change => {
    const { conditions, condition } = this.props;
    return conditions.filter(c => Boolean(change) !== (c.value === condition))[0] || {};
  };

  render() {
    const { className, cross } = this.props;

    return (
      <span onClick={this.onClick} className={classNames('ecos-filters-condition', cross && 'ecos-filters-condition_cross', className)}>
        {this.getCondition().label}
      </span>
    );
  }
}
