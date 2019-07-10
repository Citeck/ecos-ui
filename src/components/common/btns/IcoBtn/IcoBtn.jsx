import React, { Component } from 'react';
import classNames from 'classnames';
import PointsLoader from '../../PointsLoader/PointsLoader';

export default class IcoBtn extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-btn', props.className);

    const text = <span className={'ecos-btn__text'}>{props.children}</span>;
    const first = props.invert ? text : <i className={classNames('ecos-btn__i', props.children && 'ecos-btn__i_left', props.icon)} />;
    const second = props.invert ? <i className={classNames('ecos-btn__i', props.children && 'ecos-btn__i_right', props.icon)} /> : text;

    return (
      <button {...props} className={cssClasses}>
        {props.loading && <PointsLoader />}
        {!props.loading && first}
        {!props.loading && second}
      </button>
    );
  }
}
