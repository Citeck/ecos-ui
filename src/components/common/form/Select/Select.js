import React, { Component } from 'react';
import classNames from 'classnames';
import ReactSelect from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import { t } from '../../../../helpers/util';
import './Select.scss';

export default class Select extends Component {
  selectLoadingMessage = () => t('ecos-ui.select.loading-message');
  selectNoOptionsMessage = () => t('ecos-ui.select.no-options-message');

  render() {
    const props = this.props;
    const cssClasses = classNames('select', props.className);
    const SelectComponent = !props.loadOptions ? ReactSelect : AsyncSelect;

    return (
      <SelectComponent
        loadingMessage={this.selectLoadingMessage}
        noOptionsMessage={this.selectNoOptionsMessage}
        {...props}
        className={cssClasses}
        classNamePrefix="select"
      />
    );
  }
}
