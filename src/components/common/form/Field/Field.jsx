import React, { Component } from 'react';
import classNames from 'classnames';

import './Field.scss';

export default class Field extends Component {
  render() {
    const props = this.props;

    return (
      <div className={classNames('ecos-field', props.isSmall ? 'ecos-field_small' : '', props.className)}>
        <div className={classNames('ecos-field__label', props.isSmall ? 'ecos-field__label_small' : '')}>{props.label}</div>
        <div className={classNames('ecos-field__control', props.isSmall ? 'ecos-field__control_small' : '')}>{props.children}</div>
      </div>
    );
  }
}
