import React from 'react';

import Input from './Input';
import BaseMLField from '../BaseMLField';

import './Input.scss';

class MLText extends BaseMLField {
  shouldComponentUpdate(nextProps, nextState) {
    if (Object.keys(nextProps.value).length === this.props.languages.length) {
      return true;
    }

    if (nextState.selectedLang !== this.state.selectedLang) {
      return true;
    }

    return false;
  }

  renderInputElement = () => {
    return <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
}

export default MLText;
