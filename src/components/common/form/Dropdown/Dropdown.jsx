import React, { Component } from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import classNames from 'classnames';

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

    this.state = {
      dropdownOpen: false,
      selected: props.value
    };
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

  onClick = selected => {
    const props = this.props;
    this.toggle();
    this.setState({ selected: selected[props.valueField] });

    if (typeof props.onClick === 'function') {
      props.onClick(selected);
    }
  };

  render() {
    const cssClasses = classNames('dropdown', this.props.className);
    const { valueField, titleField, source } = this.props;

    const selected = this.props.source.find(item => item[valueField] === this.state.selected) || source[0] || {};

    const items = source.map(item => {
      return (
        <MenuItem key={item[valueField]} onClick={this.onClick} item={item}>
          {item[titleField]}
        </MenuItem>
      );
    });

    return (
      <Drd className={cssClasses} isOpen={this.state.dropdownOpen} toggle={this.toggle}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={this.state.dropdownOpen} tag="span">
          {this.getControl(selected[titleField])}
        </DropdownToggle>

        <DropdownMenu className={'dropdown__menu'}>
          <ul>{items}</ul>
        </DropdownMenu>
      </Drd>
    );
  }
}
