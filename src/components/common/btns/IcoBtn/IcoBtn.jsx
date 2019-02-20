import React, { Component } from 'react';
import classNames from 'classnames';

export default class IcoBtn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('btn', props.className);

    const text = <span className={'btn__text'}>{props.children}</span>;
    const first = props.invert ? text : <i className={classNames('btn__i', props.children && 'btn__i_left', props.icon)} />;
    const second = props.invert ? <i className={classNames('btn__i', props.children && 'btn__i_right', props.icon)} /> : text;

    return (
      <a {...props} className={cssClasses}>
        {first}
        {second}
      </a>
    );
  }
}
