import React from 'react';
import classNames from 'classnames';

import Input from './Input';
import BaseMLField from '../BaseMLField';

import './Input.scss';

class MLText extends BaseMLField {
  render() {
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
  }
}

export default MLText;
