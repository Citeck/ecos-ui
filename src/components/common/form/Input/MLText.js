import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Input from './Input';
import BaseMLField from '../BaseMLField';

import './Input.scss';

class MLText extends BaseMLField {
  static propTypes = {
    className: PropTypes.string,
    imgClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    languages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        img: PropTypes.string
      })
    ),
    value: PropTypes.object,
    style: PropTypes.object,
    lang: PropTypes.string,
    onChange: PropTypes.func
  };

  render() {
    const { className, style } = this.props;

    return (
      <div style={style} className={classNames('ecos-ml-text', className)}>
        <Input {...this.inputProps} value={this.value} onChange={this.handleChangeText} />
        {this.renderLang()}
      </div>
    );
  }
}

export default MLText;
