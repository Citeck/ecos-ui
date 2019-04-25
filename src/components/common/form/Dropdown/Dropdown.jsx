import React, { Component } from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import './Dropdown.scss';

class MenuItem extends React.PureComponent {
  onClick = () => {
    this.props.onClick(this.props.item);
  };

  render() {
    return <li onClick={this.onClick}>{this.props.children}</li>;
  }
}

export default class Dropdown extends Component {
  constructor(props) {
    super(props);
    this.state = { dropdownOpen: false };
  }

  toggle = () => {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  };

  getControl = text => {
    const props = this.props;
    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        children: props.isButton ? '' : text
      });
    });
  };

  onChange = selected => {
    const props = this.props;
    this.toggle();
    if (typeof props.onChange === 'function') {
      props.onChange(selected);
    }
  };

  render() {
    const cssClasses = classNames('ecos-dropdown', this.props.className);
    const { valueField, titleField, source, value, isStatic, hasEmpty } = this.props;

    const selected = source.find(item => item[valueField] === value) || (!hasEmpty && source[0]) || {};

    const items = source.map(item => {
      return (
        <MenuItem key={item[valueField]} onClick={this.onChange} item={item}>
          {item[titleField]}
        </MenuItem>
      );
    });

    return (
      <Drd className={cssClasses} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={this.state.dropdownOpen} tag="span">
          {isStatic ? this.props.children : this.getControl(selected[titleField])}
        </DropdownToggle>

        <DropdownMenu className={'ecos-dropdown__menu'}>
          <ul>{items}</ul>
        </DropdownMenu>
      </Drd>
    );
  }
}

Dropdown.propTypes = {
  isStatic: PropTypes.bool
};
