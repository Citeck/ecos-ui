import React, { Component } from 'react';
import classNames from 'classnames';

import './Textarea.scss';

export default class Textarea extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('textarea', props.className);

    return <textarea type="textarea" {...props} className={cssClasses} />;
  }
}
