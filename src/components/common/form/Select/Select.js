import React, { Component } from 'react';
import classNames from 'classnames';
import ReactSelect from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../helpers/export/util';

import './Select.scss';

export default class Select extends Component {
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
    let { handleSetValue, defaultValue } = this.props;

    if ((isString(value) || isBoolean(value)) && isFunction(handleSetValue)) {
      value = handleSetValue(value, options || []);
    }

    return value === undefined ? defaultValue : value;
  };

  componentWillReceiveProps(nextProps) {
    const { value, options } = nextProps;
    this.setState({ value: this.handleSetValue(value, options || this._options) });
  }

  render() {
    const { loadOptions, ...props } = this.props;
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
        className={classNames('ecos-select', props.className)}
        classNamePrefix="select"
      />
    );
  }
}
