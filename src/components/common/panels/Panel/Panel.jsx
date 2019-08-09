import React, { Component } from 'react';
import classNames from 'classnames';

import { Well } from '../../form';

import './Panel.scss';

export default class Panel extends Component {
  render() {
    const { className, headClassName, bodyClassName, header, children, style = {} } = this.props;
    const cssClasses = classNames('ecos-panel', className);

    return (
      <Well className={cssClasses} style={style}>
        <div className={classNames('ecos-panel__head', headClassName)}>{header}</div>
        <div className={classNames('ecos-panel__body', bodyClassName)}>{children}</div>
      </Well>
    );
  }
}
