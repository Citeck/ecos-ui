import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../helpers/util';

import '../Input/Input.scss';
import './DatePicker.scss';

class CustomInput extends Component {
  render() {
    const { getRef, ...otherProps } = this.props;

    return <input ref={el => typeof getRef === 'function' && getRef(el)} {...otherProps} />;
  }
}

export default class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen
    };
  }

  handleToggleCalendar = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleInputClick = event => {
    const { onInputClick } = this.props;

    if (isFunction(onInputClick)) {
      event.persist();
      onInputClick(event);
    }

    this.setState({ isOpen: true });
  };

  render() {
    const { className, showIcon, dateFormat = 'P', wrapperClasses, ...otherProps } = this.props;
    const { isOpen } = this.state;
    const cssClasses = classNames('ecos-input', className);
    const wrapperCssClasses = classNames(
      'ecos-datepicker',
      {
        'ecos-datepicker_show-icon': showIcon
      },
      wrapperClasses
    );

    const calendarIcon = showIcon ? (
      <span className="icon icon-calendar ecos-datepicker__icon" onClick={this.handleToggleCalendar} />
    ) : null;

    let additionalProps = {};
    let selected = otherProps.selected;

    if (otherProps.showTimeInput) {
      additionalProps.timeInputLabel = `${t('ecos-forms.datepicker.time-input-label')}:`;
      additionalProps.dateFormat = 'P HH:mm';
    }

    if (selected && !(selected instanceof Date)) {
      selected = new Date(selected);
    }

    if (window.isNaN(selected)) {
      selected = '';
    }

    return (
      <div className={wrapperCssClasses}>
        <DatePicker
          customInput={<CustomInput getRef={el => (this.datePickerInput = el)} />}
          dateFormat={dateFormat}
          // showMonthDropdown
          // showYearDropdown
          // dropdownMode="select"
          // popperPlacement="top-end"
          {...otherProps}
          selected={selected || null}
          {...additionalProps}
          open={isOpen}
          className={cssClasses}
          calendarClassName="ecos-datepicker__calendar"
          onInputClick={this.handleInputClick}
        />
        {calendarIcon}
      </div>
    );
  }
}
