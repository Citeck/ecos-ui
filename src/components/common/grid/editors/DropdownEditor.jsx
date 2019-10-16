import React from 'react';
import { Select } from '../../form';
import Records from '../../../../components/Records';
import BaseEditor from './BaseEditor';

export default class DropdownEditor extends BaseEditor {
  constructor(props) {
    super(props);
    this.state = { options: [] };
  }

  componentDidMount() {
    const { row, column } = this.props;

    Records.get((row || {}).id)
      .load(`#${(column || {}).attribute}?options`)
      .then(res => this.setState({ options: res }));
  }

  onChange = value => {
    this.setValue({
      disp: value.label,
      str: value.value
    });
  };

  render() {
    const { value, onUpdate, ...rest } = this.props;
    const { options } = this.state;

    return (
      <Select
        {...rest}
        autoFocus
        onChange={this.onChange}
        className={'select_extra-narrow'}
        placeholder={''}
        getOptionLabel={options => options.label}
        getOptionValue={options => options.value}
        options={options}
        value={options.filter(o => o.value === (value || {}).str)[0]}
        styles={{
          menu: css => ({
            ...css,
            zIndex: 11,
            width: 'auto'
          }),
          dropdownIndicator: css => ({
            ...css,
            padding: '0 !important'
          }),
          valueContainer: css => ({
            ...css,
            paddingLeft: '3px !important'
          })
        }}
      />
    );
  }
}
