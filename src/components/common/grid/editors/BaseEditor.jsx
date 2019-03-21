import React from 'react';
import { Input } from '../../form';

export default class BaseEditor extends React.Component {
  constructor(props) {
    super(props);
    this._value = this.props.value;
  }

  getValue() {
    return this._value;
  }

  onChange = e => {
    this._value = e.target.value;
  };

  render() {
    const { value, onUpdate, ...rest } = this.props;

    return <Input type={'text'} {...rest} className={'ecos-input_grid-editor'} onChange={this.onChange} autoFocus />;
  }
}
