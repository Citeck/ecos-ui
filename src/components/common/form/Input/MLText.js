import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import uuidV4 from 'uuidv4';

import Input from './Input';
import { allowedLanguages } from '../../../../constants/lang';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { prepareTooltipId } from '../../../../helpers/util';
import Tooltip from '../../Tooltip';

import './Input.scss';

class MLText extends Component {
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

  static defaultProps = {
    languages: allowedLanguages
  };

  #key = prepareTooltipId(uuidV4());

  constructor(props) {
    super(props);

    let selectedLang = props.lang;
    if (!selectedLang) {
      selectedLang = this.getLocaleWithValue(props.value);
    }

    this.state = {
      selectedLang
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.value && !isEqual(this.props.value, prevProps.value)) {
      let selectedLang = this.getLocaleWithValue(this.props.value);
      if (this.state.selectedLang !== selectedLang) {
        this.setState({ selectedLang });
      }
    }
  }

  getLocaleWithValue(values) {
    const currentLocale = getCurrentLocale();
    if (values && !values[currentLocale]) {
      for (let lang in values) {
        if (values.hasOwnProperty(lang) && values[lang]) {
          return lang;
        }
      }
    }
    return currentLocale;
  }

  get value() {
    const { value } = this.props;
    const { selectedLang } = this.state;

    return get(value, selectedLang, '');
  }

  get inputProps() {
    const { inputClassName, ...props } = this.props;
    const inputProps = omit(props, ['onChange', 'style', 'lang', 'languages', 'className', 'setWrapperProps']);

    return {
      ...inputProps,
      className: classNames('ecos-ml-text__input', inputClassName)
    };
  }

  handleChangeText = event => {
    const { value: oldValue, onChange } = this.props;
    const { selectedLang } = this.state;
    const { value } = event.target;
    const newValue = {
      ...oldValue,
      [selectedLang]: value
    };

    if (typeof onChange === 'function') {
      onChange(newValue);
    }
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
        <div key={lang.id} className="ecos-ml-text__tooltip-lang" onClick={() => this.handleClickLang(lang.id)}>
          <span className="ecos-ml-text__tooltip-lang-label">{lang.label}</span>
          <img className="ecos-ml-text__tooltip-lang-image" src={lang.img} alt={lang.label} />
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
        className="ecos-ml-text__tooltip"
        arrowClassName="ecos-ml-text__tooltip-arrow"
        delay={{ show: 0, hide: 200 }}
        contentComponent={this.renderTooltip()}
      >
        <img
          id={this.#key}
          className={classNames('ecos-ml-text__image', imgClassName)}
          src={lang.img}
          alt={lang.label}
          {...extraImageProps}
        />
      </Tooltip>
    );
  }

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
