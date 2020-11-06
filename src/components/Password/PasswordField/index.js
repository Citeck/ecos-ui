import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isArray from 'lodash/isArray';

import { t } from '../../../helpers/util';
import { passwordValidator } from '../../../helpers/validators';
import { Input } from '../../common/form';
import { Icon } from '../../common';

import './style.scss';

const Labels = {
  Rules: {
    VALID_CHARACTERS: 'password-field.rule.valid-characters',
    COUNT_CHARACTERS: 'password-field.rule.count-characters',
    COUNT_DIGITS: 'password-field.rule.count-digits',
    COUNT_CAPITALS: 'password-field.rule.count-capitals',
    COUNT_LOWERCASE: 'password-field.rule.count-lowercase',
    REQUIRED: 'password-field.rule.required'
  }
};

const MsgTypes = {
  ERROR: 'error'
};
// eslint-disable-next-line no-useless-escape
const BASE_RULE = /[а-яА-ЯёЁ\w`~!@#$%^&*()\-_+=|\\/,.?<>\[\];'{}:" ]{3,}$/;
const RULES = [
  {
    key: 'count-characters',
    name: Labels.Rules.COUNT_CHARACTERS,
    rule: /[^\s]{3,}/
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

export default class PasswordField extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    keyValue: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    errMsgs: PropTypes.array,
    autocomplete: PropTypes.bool,
    verifiable: PropTypes.bool,
    validator: PropTypes.func
  };

  static defaultProps = {
    className: '',
    autocomplete: false,
    verifiable: false,
    type: 'text',
    validator: passwordValidator
  };

  state = {
    isShowWord: false,
    touched: false
  };

  componentWillUnmount() {
    this.setState({ touched: false, isShowWord: false });
  }

  get messages() {
    const { verifiable, errMsgs, value } = this.props;
    const { touched } = this.state;
    const messages = [];

    if (verifiable) {
      messages.push({ text: Labels.Rules.VALID_CHARACTERS });
    }

    if (isArray(errMsgs)) {
      errMsgs.forEach(msg => {
        messages.push({ text: msg, type: MsgTypes.ERROR });
      });
    }

    if (touched && !String(value || '')) {
      messages.push({ text: Labels.Rules.REQUIRED, type: MsgTypes.ERROR });
    }

    return messages;
  }

  onChange = e => {
    const { onChange, keyValue: key, validator } = this.props;
    const value = e.target.value;

    onChange && onChange({ value, key, valid: validator(String(value)) });
  };

  onFocus = () => {
    if (!this.state.touched) {
      this.setState({ touched: true });
    }
  };

  toggleEye = () => {
    this.setState(state => ({ isShowWord: !state.isShowWord }));
  };

  renderRules() {
    const { value } = this.props;
    const { touched } = this.state;

    return (
      <div className="ecos-password-rules">
        {RULES.map(item => (
          <div
            key={getKey()}
            className={classNames('ecos-password-rules__item', {
              'ecos-password-rules__item_invalid': touched && !item.rule.test(String(value || '')),
              'ecos-password-rules__item_valid': touched && item.rule.test(String(value || ''))
            })}
          >
            <Icon className="ecos-password-rules__item-icon icon-small-check" />
            {t(item.name)}
          </div>
        ))}
      </div>
    );
  }

  renderMessages() {
    return (
      <div className="ecos-password-messages">
        {this.messages.map(msg => (
          <div
            key={getKey()}
            className={classNames('ecos-password-messages__item', { [`ecos-password-messages__item_${msg.type}`]: !!msg.type })}
          >
            {t(msg.text)}
          </div>
        ))}
      </div>
    );
  }

  get type() {
    const { type } = this.props;
    const { isShowWord } = this.state;

    if (type === 'text') {
      return type;
    }

    return isShowWord ? 'text' : 'password';
  }

  render() {
    const { className, keyValue, autocomplete, verifiable, value, valid, errMsgs, forwardedRef, name, validator, ...addProps } = this.props;
    const { isShowWord, touched } = this.state;
    const check = BASE_RULE.test(String(value || ''));

    return (
      <div className={classNames('ecos-password', className)}>
        {verifiable && this.renderRules()}
        <div className="ecos-password-field">
          <Input
            {...addProps}
            forwardedRef={forwardedRef}
            defaultValue={value}
            type={this.type}
            name={name}
            className={classNames('ecos-password-field__input ecos-input_focus ecos-input_hover', {
              'ecos-password-field__input_invalid':
                (verifiable && touched && !check) || this.messages.some(msg => msg.type === MsgTypes.ERROR),
              'ecos-password-field__input_valid': verifiable && touched && check,
              'ecos-password-field__input_show-word': isShowWord
            })}
            onChange={this.onChange}
            autoComplete={autocomplete ? 'on' : 'off'}
            onFocus={this.onFocus}
          />
          <Icon
            className={classNames('ecos-password-field__icon-btn ecos-password-field__opener', {
              'icon-small-eye-show': isShowWord,
              'icon-small-eye-hide': !isShowWord
            })}
            onClick={this.toggleEye}
          />
        </div>
        {!!this.messages.length && this.renderMessages()}
      </div>
    );
  }
}

function getKey() {
  return Math.random() + '-' + Date.now();
}
