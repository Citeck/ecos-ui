import React, { Component } from 'react';
import classNames from 'classnames';

export default class TwoIcoBtn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-btn ecos-btn_mi', props.className);
    const [first, second] = props.icons;

    return (
      <button {...props} className={cssClasses}>
        <i className={classNames('ecos-btn__i', first)} />
        {props.children}
        <i className={classNames('ecos-btn__i', second)} />
      </button>
    );
  }
}
