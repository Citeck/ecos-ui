import React, { Component } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import './FiltersCondition.scss';

export default class FiltersCondition extends Component {
  constructor(props) {
    super(props);

    this.state = {
      condition: this.getInitCondition(props)
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.condition, this.props.condition) && !isEqual(this.props.condition, this.state.condition.value)) {
      const condition = this.getInitCondition();

      this.setState({ condition });
    }
  }

  componentWillUnmount() {
    this.saveData.cancel();
  }

  handleClick = () => {
    const { index, onClick } = this.props;
    const condition = this.getCondition(true);

    this.setState({ condition });
    this.saveData(() => onClick({ condition: condition.value, index }));
  };

  saveData = debounce(callback => callback(), 450);

  getInitCondition = (props = this.props) => {
    return (props.conditions || []).find(c => Boolean() !== (c.value === props.condition)) || {};
  };

  getCondition = change => {
    const { conditions } = this.props;
    const { condition } = this.state;

    return conditions.find(c => Boolean(change) !== (c.value === condition.value)) || {};
  };

  render() {
    const { className, cross } = this.props;
    const { condition } = this.state;

    return (
      <span
        onClick={this.handleClick}
        className={classNames('ecos-filters-condition', { 'ecos-filters-condition_cross': cross }, className)}
      >
        {condition.label}
      </span>
    );
  }
}
