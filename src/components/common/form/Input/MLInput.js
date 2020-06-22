import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import classNames from 'classnames';

import Input from './Input';
import { defaultLanguages } from '../../../../constants/lang';
import { getCurrentLocale } from '../../../../helpers/export/util';

class MLInput extends Component {
  static propTypes = {
    className: PropTypes.string,
    imgClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    languages: PropTypes.array,
    value: PropTypes.object,
    lang: PropTypes.string
  };

  static defaultProps = {
    languages: defaultLanguages,
    lang: getCurrentLocale()
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedLang: props.lang,
      value: props.value
    };
  }

  get value() {
    const { selectedLang, value } = this.state;

    return get(value, selectedLang, '');
  }

  handleChangeText = event => {
    const { value } = event.target;

    this.setState(state => ({
      value: {
        ...state.value,
        [state.selectedLang]: value
      }
    }));
  };

  renderLang() {
    const { languages, imgClassName } = this.props;
    const { selectedLang } = this.state;
    const lang = languages.find(item => item.id === selectedLang);

    if (!lang) {
      return null;
    }

    return <img className={classNames('ecos-ml-input__image', imgClassName)} src={lang.img} alt={lang.label} />;
  }

  render() {
    const { className, inputClassName, style, ...props } = this.props;

    return (
      <div className={classNames('ecos-ml-input', className)} style={style}>
        <Input
          {...props}
          value={this.value}
          className={classNames('ecos-ml-input__input', inputClassName)}
          onChange={this.handleChangeText}
        />
        {this.renderLang()}
      </div>
    );
  }
}

export default MLInput;
