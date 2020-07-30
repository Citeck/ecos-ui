import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classNames from 'classnames';

import { Icon } from '../common';

const TYPES = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year'
};
const DATE_ACTIONS = {
  ADD: 'add',
  SUBTRACT: 'subtract'
};

class DateSlider extends Component {
  static propTypes = {
    date: PropTypes.instanceOf(Date),
    type: PropTypes.oneOf(Object.keys(TYPES).map(key => TYPES[key])),
    canIncrement: PropTypes.bool,
    canDecrement: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    date: new Date(),
    type: TYPES.MONTH,
    canIncrement: true,
    canDecrement: true,
    onChange: () => {}
  };

  get label() {
    const { type, date } = this.props;
    let dateInMoment = moment(date);

    switch (type) {
      case TYPES.MONTH:
        return dateInMoment.format('MMMM YYYY');
      case TYPES.YEAR:
        return dateInMoment.format('YYYY');
      case TYPES.DAY:
      default:
        return dateInMoment.format('D MMMM YYYY');
    }
  }

  handleClick = ([action = '', count = 1]) => {
    const { onChange, type, date } = this.props;
    const dateInMoment = moment(date);
    let datePath = 'd';

    if (!action) {
      return;
    }

    switch (type) {
      case TYPES.MONTH:
        datePath = 'M';
        break;
      case TYPES.YEAR:
        datePath = 'y';
        break;
      case TYPES.DAY:
      default:
        datePath = 'd';
        break;
    }

    dateInMoment[action](count, datePath);
    onChange(dateInMoment.toDate());
  };

  renderPrevArrow() {
    const { canDecrement } = this.props;

    return (
      <Icon
        className={classNames('icon-small-left ecos-date-slider__btn', {
          'ecos-date-slider__btn_disabled': !canDecrement
        })}
        onClick={this.handleClick.bind(null, [DATE_ACTIONS.SUBTRACT])}
      />
    );
  }

  renderNextArrow() {
    const { canIncrement } = this.props;

    return (
      <Icon
        className={classNames('icon-small-right ecos-date-slider__btn', {
          'ecos-date-slider__btn_disabled': !canIncrement
        })}
        onClick={this.handleClick.bind(null, [DATE_ACTIONS.ADD])}
      />
    );
  }

  render() {
    return (
      <div className="ecos-date-slider">
        {this.renderPrevArrow()}
        <div className="ecos-date-slider__label">{this.label}</div>
        {this.renderNextArrow()}
      </div>
    );
  }
}

export default React.memo(DateSlider);
