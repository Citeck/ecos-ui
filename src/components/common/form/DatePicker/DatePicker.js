import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import moment from 'moment';

import { t } from '../../../../helpers/util';

import '../Input/Input.scss';
import './DatePicker.scss';

class CustomInput extends Component {
  render() {
    const { getRef, dateFormat, value, ...otherProps } = this.props;
    const val = moment(value).format(dateFormat);

    return <input ref={el => typeof getRef === 'function' && getRef(el)} value={val} {...otherProps} />;
  }
}

export default class extends Component {
  static propTypes = {
    className: PropTypes.string,
    dateFormat: PropTypes.string,
    dateFormatInput: PropTypes.string,
    selected: PropTypes.instanceOf(Date),
    showIcon: PropTypes.bool,
    showTimeInput: PropTypes.bool,
    wrapperClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    dateFormat: 'P',
    selected: null
  };

  get additionalProps() {
    const additionalProps = {};

    if (this.props.showTimeInput) {
      additionalProps.timeInputLabel = `${t('ecos-forms.datepicker.time-input-label')}:`;
      additionalProps.dateFormat = 'P HH:mm';
    }

    return additionalProps;
  }

  get selected() {
    let selected = this.props.selected || null;

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
      <span
        className="icon icon-calendar ecos-datepicker__icon"
        onClick={() => {
          this.datePickerInput && this.datePickerInput.click();
        }}
      />
    ) : null;
  };

  render() {
    const { className, showIcon, dateFormat = 'P', wrapperClasses, dateFormatInput = dateFormat, ...otherProps } = this.props;

    return (
      <div className={classNames('ecos-datepicker', { 'ecos-datepicker_show-icon': showIcon }, wrapperClasses)}>
        <DatePicker
          {...otherProps}
          {...this.additionalProps}
          customInput={<CustomInput dateFormat={dateFormatInput} getRef={el => (this.datePickerInput = el)} />}
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
