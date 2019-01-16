import React, { Component } from 'react';
import Button from '../Button/Button';

import './ToggleButton.scss';
import classNames from 'classnames';

export default class ToggleButton extends Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = { collapse: false };
  }

  toggle() {
    this.setState({ collapse: !this.state.collapse });
  }

  render() {
    const cssClasses = classNames('toggle-settings', this.props.className);

    return (
      <div className={cssClasses}>
        <Button onClick={this.props.onClick} className={'toggle-settings__button'}>
          <i className="icon-settings toggle-settings__icon-settings" />
          <i className="icon-down  toggle-settings__icon-down" />
        </Button>

        {/*<Collapse isOpen={this.state.collapse}>*/}
        {/*{this.props.content}*/}
        {/*</Collapse>*/}
      </div>
    );
  }
}
