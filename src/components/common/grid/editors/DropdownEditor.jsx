import React from 'react';
import { Select } from '../../form';
import { RecordService } from '../../../../api/recordService';
import BaseEditor from './BaseEditor';

export default class DropdownEditor extends BaseEditor {
  constructor(props) {
    super(props);
    this.state = { options: [] };
  }

  componentDidMount() {
    const createVariants = this.props.createVariants || [];

    if (createVariants.length) {
      const api = new RecordService({});
      api
        .query({
          record: `TYPE:"${createVariants[0].type}"`,
          attributes: {
            options: `#${(this.props.column || {}).attribute}?options`
          }
        })
        .then(resp => {
          this.setState({ options: resp.attributes.options });
        });
    }
  }

  onChange = value => {
    this._value = value.value;
  };

  render() {
    const { value, onUpdate, ...rest } = this.props;

    return (
      <Select
        {...rest}
        autoFocus
        onChange={this.onChange}
        className={'select_extra-narrow'}
        placeholder={''}
        getOptionLabel={options => options.title}
        getOptionValue={options => options.value}
        options={this.state.options}
        styles={{
          menu: css => ({
            ...css,
            zIndex: 2,
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
