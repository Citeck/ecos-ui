import React, { Component } from 'react';
import ReactDatePicker from 'react-datepicker';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { t } from '../../../../helpers/util';

import '../Input/Input.scss';
import './DatePicker.scss';

class CustomInput extends Component {
  render() {
    const { getRef, ...otherProps } = this.props;

    return <input ref={el => typeof getRef === 'function' && getRef(el)} {...otherProps} />;
  }
}

export default class DatePicker extends Component {
  static propTypes = {
    className: PropTypes.string,
    dateFormat: PropTypes.string,
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    showIcon: PropTypes.bool,
    showTimeInput: PropTypes.bool,
    wrapperClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    dateFormat: 'P',
    selected: null
  };

  get timeProps() {
    const additionalProps = {};

    if (this.props.showTimeInput) {
      additionalProps.timeInputLabel = `${t('ecos-forms.datepicker.time-input-label')}:`;
      additionalProps.dateFormat = 'P hh:mm';
    }

    return additionalProps;
  }

  get selected() {
    let selected = this.props.selected || this.props.value || null;

    if (selected && !(selected instanceof Date)) {
      selected = new Date(selected);
    }

    if (window.isNaN(selected)) {
      selected = null;
    }

    return selected;
  }

  renderIcon = () => {
    return this.props.showIcon ? (
      <span className="icon icon-calendar ecos-datepicker__icon" onClick={() => this.datePickerInput && this.datePickerInput.click()} />
    ) : null;
  };

  render() {
    const { className, showIcon, dateFormat, wrapperClasses, value, ...otherProps } = this.props;

    return (
      <div className={classNames('ecos-datepicker', { 'ecos-datepicker_show-icon': showIcon }, wrapperClasses)}>
        <ReactDatePicker
          {...otherProps}
          {...this.timeProps}
          customInput={<CustomInput getRef={el => (this.datePickerInput = el)} />}
          dateFormat={dateFormat}
          selected={this.selected}
          className={classNames('ecos-input', className)}
          calendarClassName="ecos-datepicker__calendar"
        />
        {this.renderIcon()}
      </div>
    );
  }
}
