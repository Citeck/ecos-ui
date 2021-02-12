import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Label from '../Label';

import './Field.scss';

export default class Field extends Component {
  static propTypes = {
    isSmall: PropTypes.bool,
    isRequired: PropTypes.bool,
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    label: PropTypes.string,
    labelPosition: PropTypes.string,
    labelFor: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
  };

  static defaultProps = {
    className: '',
    labelClassName: ''
  };

  render() {
    const { isSmall, className, labelClassName, label, children, labelFor, isRequired, labelPosition } = this.props;

    return (
      <div
        className={classNames('ecos-field', className, {
          'ecos-field_small': isSmall
        })}
      >
        {label && (
          <Label
            htmlFor={labelFor}
            className={classNames('ecos-field__label', labelClassName, {
              'ecos-field__label_small': isSmall,
              'ecos-field__label_required': isRequired,
              [`ecos-field__label_align-${labelPosition}`]: labelPosition
            })}
          >
            {label}
          </Label>
        )}
        <div
          className={classNames('ecos-field__control', {
            'ecos-field__control_small': isSmall
          })}
        >
          {children}
        </div>
      </div>
    );
  }
}
