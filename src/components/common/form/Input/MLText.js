import React from 'react';

import Input from './Input';
import BaseMLField from '../BaseMLField';

import './Input.scss';

class MLText extends BaseMLField {
  renderInputElement = () => {
    return <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
  /*render() {
    const { className, style, viewOnly } = this.props;

    if (viewOnly) {
      return this.value || '-';
    }

    return (
      <div style={style} className={classNames('ecos-ml-text', className)}>
        <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />
        {this.renderLang()}
      </div>
    );
  }*/
}

export default MLText;
