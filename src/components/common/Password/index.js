import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { Input } from '../form';

import './style.scss';
import { Icon } from '../index';

const Labels = {
  Rules: {
    VALID_CHARACTERS: 'Допустимы латинские, русские и другие символы',
    COUNT_CHARACTERS: 'минимум 3 знака/символа',
    COUNT_DIGITS: '1 цифра',
    COUNT_CAPITALS: '1 заглавная',
    COUNT_LOWERCASE: '1 строчная'
  },
  Titles: {}
};

const BASE_RULE = /[а-яА-ЯёЁ\w\`\~\!@\#\$\%\^\&\*\(\)\-\_\+\=\|\\\/\,\.\?\<\>\[\]\;\'\{\}\:\"\ ]{3,}$/;
const RULES = [
  {
    key: 'count-characters',
    name: Labels.Rules.COUNT_CHARACTERS,
    rule: /[^ \t\n\r\f\v]{3,}/
  },
  {
    key: 'count-digits',
    name: Labels.Rules.COUNT_DIGITS,
    rule: /\d+/
  },
  {
    key: 'count-capitals',
    name: Labels.Rules.COUNT_CAPITALS,
    rule: /[А-ЯЁA-Z]+/
  },
  {
    key: 'count-lowercase',
    name: Labels.Rules.COUNT_LOWERCASE,
    rule: /[a-zа-яё]+/
  }
];

class Password extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    keyValue: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    autocomplete: PropTypes.bool,
    verifiable: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    keyValue: '',
    autocomplete: false,
    verifiable: false
  };

  state = {
    isShowWord: false
  };

  onChange = e => {
    const { onChange, keyValue } = this.props;

    onChange && onChange(e.target.value, keyValue);
  };

  toggleEye = () => {
    this.setState(state => ({ isShowWord: !state.isShowWord }));
  };

  renderRules() {
    const { verifiable, value } = this.props;
    const strValue = value ? String(value) : '';

    if (!verifiable) {
      return null;
    }

    return (
      <div className="ecos-password-rules">
        {RULES.map(item => (
          <div
            key={Math.random()}
            className={classNames('ecos-password-rules__item', {
              'ecos-password-rules__item_invalid': !!strValue && !item.rule.test(strValue),
              'ecos-password-rules__item_valid': !!strValue && item.rule.test(strValue)
            })}
          >
            <Icon className="ecos-password-rules__item-icon icon-check" />
            {t(item.name)}
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { className, keyValue, autocomplete, verifiable, value, valid, ...addProps } = this.props;
    const { isShowWord } = this.state;
    const check = BASE_RULE.test(String(value));

    return (
      <div className={classNames('ecos-password', className)}>
        {verifiable && this.renderRules()}
        <div className="ecos-password-field">
          <Input
            {...addProps}
            value={value}
            type={isShowWord ? 'text' : 'password'}
            className={classNames('ecos-password-field__input', {
              'ecos-password-field__input_invalid': (verifiable && !!value && !check) || valid === false,
              'ecos-password-field__input_valid': (verifiable && !!value && check) || valid
            })}
            onChange={this.onChange}
            autoComplete={autocomplete ? 'on' : 'off'}
          />
          <Icon
            className={classNames('ecos-password-field__icon-btn ecos-password-field__opener', {
              'icon-on': isShowWord,
              'icon-off': !isShowWord
            })}
            onClick={this.toggleEye}
          />
        </div>
        {verifiable && <div className="ecos-password-rule">{t(Labels.Rules.VALID_CHARACTERS)}</div>}
      </div>
    );
  }
}

export default Password;
