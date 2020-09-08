import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import uuidV4 from 'uuidv4';
import omit from 'lodash/omit';

import Tooltip from '../../Tooltip';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { prepareTooltipId } from '../../../../helpers/util';
import { allowedLanguages } from '../../../../constants/lang';

import './style.scss';

class BaseMLField extends Component {
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

  _key = prepareTooltipId(uuidV4());

  constructor(props) {
    super(props);

    let selectedLang = props.lang;

    if (!selectedLang) {
      selectedLang = this.getLocaleWithValue(props.value);
    }

    this.state = {
      selectedLang,
      isShowTooltip: false,
      isShowButton: false,
      isFocus: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    // TODO: ask about it later
    // if (!this.value && !isEqual(this.props.value, prevProps.value)) {
    //   let selectedLang = this.getLocaleWithValue(this.props.value);
    //   if (this.state.selectedLang !== selectedLang) {
    //     this.setState({ selectedLang });
    //   }
    // }
  }

  componentWillUnmount() {
    this.handleToggleShowButton.cancel();
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
      className: classNames('ecos-ml-text__input', inputClassName),
      onFocus: () => this.handleToggleFocus(true),
      onBlur: () => this.handleToggleFocus(false),
      onMouseEnter: () => this.handleToggleShowButton(true),
      onMouseLeave: () => this.handleToggleShowButton(false)
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

  handleToggleShowButton = debounce((isShowButton = !this.state.isShowButton) => {
    const newState = { isShowButton };

    if (!isShowButton) {
      newState.isShowTooltip = false;
    }

    this.setState({ ...newState });
  }, 150);

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

  handleToggleTooltip = (isShowTooltip = !this.state.isShowTooltip) => {
    if (isShowTooltip) {
      this.handleToggleShowButton(true);
    }

    this.setState({ isShowTooltip });
  };

  handleToggleFocus = (isFocus = !this.state.isFocus) => {
    this.handleToggleShowButton(isFocus);
    this.setState({ isFocus });
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
    const { selectedLang, isShowTooltip, isShowButton, isFocus } = this.state;
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
        target={this._key}
        isOpen={isShowTooltip}
        trigger="hover"
        onToggle={this.handleToggleTooltip}
        className="ecos-ml-text__tooltip"
        arrowClassName="ecos-ml-text__tooltip-arrow"
        delay={{ show: 0, hide: 450 }}
        contentComponent={this.renderTooltip()}
      >
        <img
          id={this._key}
          className={classNames('ecos-ml-text__image', imgClassName, {
            'ecos-ml-text__image_visible': isShowButton || isFocus
          })}
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
