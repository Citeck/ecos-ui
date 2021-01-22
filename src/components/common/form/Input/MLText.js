import React from 'react';

import Input from './Input';
import BaseMLField from '../BaseMLField';

import './Input.scss';

class MLText extends BaseMLField {
  renderInputElement = () => {
    return <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
}

export default MLText;
