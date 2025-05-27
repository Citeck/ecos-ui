import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactSelect from 'react-select';
import AsyncSelect from 'react-select/async';

import { t } from '@/helpers/export/util';

import './Select.scss';

class Select extends Component {
  constructor(props) {
    super(props);
    this._options = null;
    this.state = { value: this.handleSetValue(props.value, props.options || this._options) };
  }

  selectLoadingMessage = () => t('ecos-ui.select.loading-message');
  selectNoOptionsMessage = () => t('ecos-ui.select.no-options-message');

  loadOptions = () => {
    const { loadOptions, value } = this.props;

    if (loadOptions && isFunction(loadOptions)) {
      return loadOptions().then(res => {
        this._options = res;

        this.setState({ value: this.handleSetValue(value, res) });

        return res;
      });
    }
  };

  handleSetValue = (value, options) => {
    const { handleSetValue, defaultValue } = this.props;

    if ((isString(value) || isBoolean(value)) && isFunction(handleSetValue)) {
      value = handleSetValue(value, options || []);
    }

    return isUndefined(value) ? defaultValue : value;
  };

  handleCloseMenuOnScroll = () => {
    const { closeMenuOnScroll } = this.props;

    if (isFunction(closeMenuOnScroll)) {
      return function (e) {
        const cl = get(e, 'target.classList');
        const innerSelect = !!cl && cl.contains('select__menu-list');
        return closeMenuOnScroll(e, { innerSelect });
      };
    }
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { value, options } = nextProps;
    this.setState({ value: this.handleSetValue(value, options || this._options) });
  }

  render() {
    const { loadOptions, closeMenuOnScroll, narrow, ...props } = this.props;
    const SelectComponent = loadOptions ? AsyncSelect : ReactSelect;

    return (
      <SelectComponent
        placeholder={t('ecos-ui.select.placeholder')}
        loadingMessage={this.selectLoadingMessage}
        noOptionsMessage={this.selectNoOptionsMessage}
        blurInputOnSelect
        {...props}
        loadOptions={this.loadOptions}
        value={this.state.value}
        className={classNames('ecos-select', props.className, {
          select_narrow: narrow
        })}
        classNamePrefix="fitnesse-select select"
        closeMenuOnScroll={this.handleCloseMenuOnScroll()}
      />
    );
  }
}

Select.propTypes = {
  loadOptions: PropTypes.bool,
  narrow: PropTypes.bool,
  className: PropTypes.string
};

export default Select;
