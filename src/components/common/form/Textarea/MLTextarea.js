import React from 'react';
import classNames from 'classnames';

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

  render() {
    const { className, style } = this.props;

    return (
      <div style={style} className={classNames('ecos-ml-text', className)}>
        <Textarea {...this.inputProps} value={this.value} onChange={this.handleChangeText} />
        {this.renderLang()}
      </div>
    );
  }
}

export default MlTextarea;
