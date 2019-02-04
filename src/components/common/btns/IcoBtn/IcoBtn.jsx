import React, { Component } from 'react';
import classNames from 'classnames';

export default class IcoBtn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('btn', props.className);

    const first = props.invert ? props.children : <i className={classNames('btn__i', props.children && 'btn__i_left', props.icon)} />;
    const second = props.invert ? <i className={classNames('btn__i', props.children && 'btn__i_right', props.icon)} /> : props.children;

    return (
      <a {...props} className={cssClasses}>
        {first}
        {second}
      </a>
    );
  }
}
