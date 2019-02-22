import React, { Component } from 'react';
import classNames from 'classnames';

import { Well } from '../../form';

import './Panel.scss';

export default class Panel extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-panel', props.className);

    return (
      <Well className={cssClasses}>
        <div className="ecos-panel__heading">{props.header}</div>
        <div className="ecos-panel__body">{props.children}</div>
      </Well>
    );
  }
}
