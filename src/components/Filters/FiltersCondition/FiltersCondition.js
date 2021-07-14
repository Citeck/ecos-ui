import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import './FiltersCondition.scss';

export default class FiltersCondition extends Component {
  constructor(props) {
    super(props);

    this.state = {
      condition: (props.conditions || []).filter(c => Boolean() !== (c.value === props.condition))[0] || {}
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.condition, this.props.condition) && !isEqual(this.props.condition && this.state.condition.value)) {
      const condition = (this.props.conditions || []).filter(c => Boolean() !== (c.value === this.props.condition))[0] || {};

      this.setState({ condition });
    }
  }

  componentWillUnmount() {
    this.saveData.cancel();
  }

  onClick = () => {
    const { index, onClick } = this.props;
    const condition = this.getCondition(true);

    this.setState({ condition });
    this.saveData(() => onClick({ condition: condition.value, index }));
  };

  saveData = debounce(callback => callback(), 450);

  getCondition = change => {
    const { conditions } = this.props;
    const { condition } = this.state;

    return conditions.filter(c => Boolean(change) !== (c.value === condition.value))[0] || {};
  };

  render() {
    const { className, cross } = this.props;
    const { condition } = this.state;

    return (
      <span onClick={this.onClick} className={classNames('ecos-filters-condition', cross && 'ecos-filters-condition_cross', className)}>
        {condition.label}
      </span>
    );
  }
}
