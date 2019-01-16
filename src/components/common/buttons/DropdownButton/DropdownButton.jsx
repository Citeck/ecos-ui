import React, { Component } from 'react';
import classNames from 'classnames';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import './DropdownButton.scss';

export default class DropdownButton extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  render() {
    const props = this.props;
    const cssClasses = classNames('button-dropdown', props.className);

    return (
      <div className={cssClasses}>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className={classNames('button-dropdown__toggle')}>
            {'Экспорт'}
          </DropdownToggle>
          <DropdownMenu className={'button-dropdown__menu'}>
            <ul>
              <li>HTML</li>
              <li>Excel</li>
              <li>CSV</li>
            </ul>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}
