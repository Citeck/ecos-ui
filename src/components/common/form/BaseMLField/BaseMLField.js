import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import uuidV4 from 'uuidv4';

import Tooltip from '../../Tooltip';
import { getCurrentLocale } from '../../../../helpers/export/util';
import { prepareTooltipId } from '../../../../helpers/util';
import { t } from '../../../../helpers/export/util';
import { allowedLanguages, LANGUAGE_EN } from '../../../../constants/lang';

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
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    viewOnly: PropTypes.bool,
    onChange: PropTypes.func
  };

  static defaultProps = {
    languages: allowedLanguages
  };

  _key = prepareTooltipId(uuidV4());
  _inputRef = null;

  constructor(props) {
    super(props);

    let selectedLang = props.lang;
    const currentLang = getCurrentLocale();

    if (!selectedLang) {
      selectedLang = this.getLocaleWithValue(props.value);
    }

    this.state = {
      selectedLang,
      isShowTooltip: false,
      isShowButton: false,
      isFocus: false,
      cursorPosition: null,
      canCheckLang: currentLang === selectedLang
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { cursorPosition, canCheckLang } = this.state;
    const isSelectedText = !isEmpty(window.getSelection().toString());

    if (!isEqual(this.props.value, prevProps.value) && canCheckLang) {
      const selectedLang = this.getLocaleWithValue(this.props.value);

      if (this.state.selectedLang !== selectedLang) {
        this.setState({ selectedLang, canCheckLang: false });
      }
    }

    if (prevProps.lang !== this.props.lang) {
      let selectedLang = this.props.lang;
      const value = get(this.props, ['value', selectedLang]);

      if (value === undefined) {
        this.props.onChange({
          ...this.props.value,
          [selectedLang]: ''
        });
      }

      if (this.state.selectedLang !== selectedLang) {
        console.warn('prevProps.lang !== this.props.lang => ', selectedLang);

        this.setState({ selectedLang });
      }
    }

    if (!isSelectedText && this._inputRef && prevState.isFocus && this.state.isFocus && cursorPosition !== null) {
      this._inputRef.setSelectionRange(cursorPosition, cursorPosition);
    }
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
    const inputProps = omit(props, [
      'onChange',
      'style',
      'lang',
      'languages',
      'className',
      'setWrapperProps',
      'imgClassName',
      'inputClassName',
      'viewOnly'
    ]);

    return {
      ...inputProps,
      forwardedRef: this.setInputRef,
      className: classNames('ecos-ml-text__input', inputClassName),
      onFocus: () => this.handleToggleFocus(true),
      onBlur: this.handleBlur,
      onClick: this.handleClick,
      onMouseEnter: () => this.handleToggleShowButton(true),
      onMouseLeave: () => this.handleToggleShowButton(false)
    };
  }

  setInputRef = ref => {
    if (!ref) {
      return;
    }

    const { forwardedRef } = this.props;

    if (typeof forwardedRef === 'function') {
      forwardedRef(ref);
    }

    this._inputRef = ref;
  };

  getLocaleWithValue(values) {
    const currentLocale = getCurrentLocale();

    if (values && !values[currentLocale]) {
      for (let lang in values) {
        if (values.hasOwnProperty(lang) && values[lang]) {
          return lang;
        }
      }
    }

    if (!isEmpty(values[currentLocale])) {
      return currentLocale;
    }

    if (!isEmpty(values[LANGUAGE_EN])) {
      return LANGUAGE_EN;
    }

    const firstNotEmptyLang = Object.keys(values).find(key => !isEmpty(values[key]));

    return firstNotEmptyLang || currentLocale;
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

    for (let key in newValue) {
      if (newValue.hasOwnProperty(key)) {
        if (isEmpty(newValue[key])) {
          delete newValue[key];
        }
      }
    }

    if (typeof onChange === 'function') {
      onChange(newValue);
    }

    this.setState({ canCheckLang: false });

    if (this._inputRef) {
      this.setState({ cursorPosition: this._inputRef.selectionStart });
    }
  };

  handleClickLang = selectedLang => {
    this.setState({ selectedLang, cursorPosition: null });
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

  handleBlur = () => {
    this.handleToggleFocus(false);
    this.setState({ cursorPosition: null });
  };

  handleClick = () => {
    if (this._inputRef) {
      this.setState({ cursorPosition: this._inputRef.selectionStart });
    }
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

  renderInputElement = () => null;

  renderViewElement = () => this.value || t('boolean.no');

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
    const { className, style, disabled, viewOnly } = this.props;

    return (
      <div
        style={style}
        className={classNames('ecos-ml-text', className, {
          'ecos-ml-text_disabled': disabled
        })}
      >
        {viewOnly ? this.renderViewElement() : this.renderInputElement()}
        {!viewOnly && this.renderLang()}
      </div>
    );
  }
}

export default BaseMLField;
