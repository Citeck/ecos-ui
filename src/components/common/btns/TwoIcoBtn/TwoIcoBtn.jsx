import React, { Component } from 'react';
import classNames from 'classnames';

export default class TwoIcoBtn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-btn btn_mi', props.className);
    const [first, second] = props.icons;

    return (
      <button {...props} className={cssClasses}>
        <i className={classNames('btn__i', first)} />
        {props.children}
        <i className={classNames('btn__i', second)} />
      </button>
    );
  }
}
