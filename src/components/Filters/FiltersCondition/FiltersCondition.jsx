import React, { Component } from 'react';
import classNames from 'classnames';
import { trigger } from '../../../helpers/util';

import './FiltersCondition.scss';

export default class FiltersCondition extends Component {
  constructor(props) {
    super(props);
    this.state = { condition: props.condition };
  }

  onClick = () => {
    const { index } = this.props;
    const condition = this.getCondition(true).value;
    this.setState({ condition });
    trigger.call(this, 'onClick', { condition, index });
  };

  getCondition = reverse => {
    return this.props.conditions.filter(condition => Boolean(reverse) !== (condition.value === this.state.condition))[0] || {};
  };

  render() {
    const { className, cross } = this.props;
    const title = this.getCondition().label;

    return (
      <span onClick={this.onClick} className={classNames('ecos-filters-condition', cross && 'ecos-filters-condition_cross', className)}>
        {title}
      </span>
    );
  }
}
