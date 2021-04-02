import React from 'react';

import Textarea from './Textarea';
import BaseMLField from '../BaseMLField';

import './Textarea.scss';

class MlTextarea extends BaseMLField {
  static defaultProps = {
    ...super.defaultProps,
    className: 'textarea__ml',
    imgClassName: 'textarea__ml-image',
    inputClassName: 'textarea__ml-input'
  };

  renderInputElement = () => {
    return <Textarea {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
}

export default MlTextarea;
