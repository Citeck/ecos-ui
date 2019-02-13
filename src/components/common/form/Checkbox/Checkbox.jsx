import React, { Component } from 'react';
import classNames from 'classnames';

import './Checkbox.scss';

export default class Checkbox extends Component {
  constructor(props) {
    super(props);

    this.state = {
      panelVisible: true
    };
  }

  showPanel = () => {
    this.setState({ panelVisible: !this.state.panelVisible });
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-checkbox', props.className);

    return (
      <div {...props} className={cssClasses}>
        {/*<i className='icon-check checkbox__icon' />*/}
      </div>
    );
  }
}
