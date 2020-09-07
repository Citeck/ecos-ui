import React, { Component } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import uuidV4 from 'uuidv4';

import Tooltip from '../../Tooltip';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { prepareTooltipId } from '../../../../helpers/util';
import { allowedLanguages } from '../../../../constants/lang';

import './style.scss';
import omit from 'lodash/omit';

class BaseMLField extends Component {
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

    this.state = { selectedLang };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.value && !isEqual(this.props.value, prevProps.value)) {
      let selectedLang = this.getLocaleWithValue(this.props.value);
      if (this.state.selectedLang !== selectedLang) {
        this.setState({ selectedLang });
      }
    }
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
    return <div />;
  }
}

export default BaseMLField;
