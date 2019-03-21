import React, { Component } from 'react';
import classNames from 'classnames';

import './Input.scss';

export default class Input extends Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.inputRef.current.focus();
    }
  }

  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-input', props.className);

    return <input ref={this.inputRef} {...props} className={cssClasses} />;
  }
}
