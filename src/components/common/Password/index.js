import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { Input } from '../form';

import './style.scss';
import { Icon } from '../index';

class Password extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    keyValue: PropTypes.string,
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
    const { verifiable } = this.props;

    if (!verifiable) {
      return null;
    }

    const rules = [
      {
        name: '8 знаков / символов', //todo,
        done: undefined
      },
      {
        name: '1 цифра', //todo,
        done: undefined
      },
      {
        name: '1 заглавная', //todo,
        done: undefined
      },
      {
        name: '1 строчная', //todo,
        done: undefined
      }
    ];

    return (
      <div className="ecos-password-rules">
        {rules.map(item => (
          <div
            key={Math.random()}
            className={classNames('ecos-password-rules-item', {
              'ecos-password-rules-item_invalid': item.done === false,
              'ecos-password-rules-item_valid': !!item.done
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
    const { className, keyValue, autocomplete, verifiable, ...addProps } = this.props;
    const { isShowWord } = this.state;

    return (
      <>
        {verifiable && this.renderRules()}
        <div className="ecos-password-field">
          <Input
            {...addProps}
            type={isShowWord ? 'text' : 'password'}
            className={classNames('ecos-password-field__input', { 'ecos-password-field__input_verifiable': verifiable }, className)}
            onChange={this.onChange}
            autocomplete={autocomplete ? 'on' : 'off'}
          />
          <Icon
            className={classNames('ecos-password-field__icon-btn ecos-password-field__opener', {
              'icon-on': isShowWord,
              'icon-off': !isShowWord
            })}
            onClick={this.toggleEye}
          />
        </div>
      </>
    );
  }
}

export default Password;
