import React, { Component } from 'react';
import classNames from 'classnames';

import './ExpanderFormatter.scss';

export default class ExpanderFormatter extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  _onClick = () => {
    this.props.onClick(this.props.rowIndex);
    this.setState({ expanded: !this.state.expanded });
  };

  render() {
    return (
      <i className={classNames('grid-expander', this.state.expanded ? 'icon-small-down' : 'icon-small-right')} onClick={this._onClick} />
    );
  }
}
