import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import classNames from 'classnames';
import uuidV4 from 'uuidv4';

import Input from './Input';
import { allowedLanguages } from '../../../../constants/lang';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { prepareTooltipId } from '../../../../helpers/util';
import Tooltip from '../../Tooltip';

import './Input.scss';

class MLInput extends Component {
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
    inputStyle: PropTypes.object,
    lang: PropTypes.string
  };

  static defaultProps = {
    languages: allowedLanguages,
    lang: getCurrentLocale()
  };

  #key = prepareTooltipId(uuidV4());

  constructor(props) {
    super(props);

    this.state = {
      selectedLang: props.lang
    };
  }

  get value() {
    const { value } = this.props;
    const { selectedLang } = this.state;

    return get(value, selectedLang, '');
  }

  get inputProps() {
    const { inputStyle, ...props } = this.props;

    return {
      ...props,
      style: inputStyle
    };
  }

  handleChangeText = event => {
    const { value: oldValue } = this.props;
    const { selectedLang } = this.state;
    const { value } = event.target;
    const newValue = {
      ...oldValue,
      [selectedLang]: value
    };

    this.props.onChange(newValue);
  };

  handleClickLang = selectedLang => {
    this.setState({ selectedLang });
  };

  renderTooltip() {
    const { languages } = this.props;
    const { selectedLang } = this.state;

    return languages
      .filter(lang => lang.id !== selectedLang)
      .map(lang => (
        <div key={lang.id} className="ecos-ml-input__tooltip-lang" onClick={() => this.handleClickLang(lang.id)}>
          <span className="ecos-ml-input__tooltip-lang-label">{lang.label}</span>
          <img className="ecos-ml-input__tooltip-lang-image" src={lang.img} alt={lang.label} />
        </div>
      ));
  }

  renderLang() {
    const { languages, imgClassName } = this.props;
    const { selectedLang } = this.state;
    const lang = languages.find(item => item.id === selectedLang);
    const extraImageProps = {};

    if (!lang) {
      return null;
    }

    if (languages.length === 2) {
      const unselected = languages.find(item => item.id !== selectedLang);

      extraImageProps.onClick = () => this.handleClickLang(unselected.id);
    }

    return (
      <Tooltip
        target={this.#key}
        uncontrolled
        className="ecos-ml-input__tooltip"
        arrowClassName="ecos-ml-input__tooltip-arrow"
        delay={{ show: 0, hide: 200 }}
        contentComponent={this.renderTooltip()}
      >
        <img
          id={this.#key}
          className={classNames('ecos-ml-input__image', imgClassName)}
          src={lang.img}
          alt={lang.label}
          {...extraImageProps}
        />
      </Tooltip>
    );
  }

  render() {
    const { className, inputClassName, style } = this.props;

    return (
      <div style={style} className={classNames('ecos-ml-input', className)}>
        <Input
          {...this.inputProps}
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
