import React from 'react';

import BaseMLField from '../BaseMLField';

import Input from './Input';

import './Input.scss';

class MLText extends BaseMLField {
  renderInputElement = () => {
    return <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
}

export default MLText;
