import React, { Component } from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { getPropByStringKey } from '../../../../helpers/util';

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
  static propTypes = {
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    isStatic: PropTypes.bool,
    right: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    menuClassName: '',
    isStatic: false,
    right: false
  };

  constructor(props) {
    super(props);
    this.state = { dropdownOpen: false };
  }

  className = 'ecos-dropdown';

  get selected() {
    const { valueField, source, value, hasEmpty } = this.props;

    return !isEmpty(source) ? source.find(item => item[valueField] === value) || (!hasEmpty && source[0]) : {};
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
        children: props.isButton ? child.props.children || '' : text
      });
    });
  };

  onChange = selected => {
    const { onChange } = this.props;

    this.toggle();

    if (typeof onChange === 'function') {
      onChange(selected);
    }
  };

  renderMenuItems() {
    const { valueField, titleField, source } = this.props;

    return (
      <ul>
        {source.map(item => {
          return (
            <MenuItem key={item[valueField]} onClick={this.onChange} item={item}>
              {getPropByStringKey(item, titleField)}
            </MenuItem>
          );
        })}
      </ul>
    );
  }

  render() {
    const { titleField, isStatic, right, className, menuClassName, children } = this.props;
    const { dropdownOpen } = this.state;
    const cssClasses = classNames(this.className, className);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} tag="span">
          {isStatic ? children : this.getControl(getPropByStringKey(this.selected, titleField))}
        </DropdownToggle>

        <DropdownMenu className={classNames(`${this.className}__menu`, { [`${this.className}__menu_right`]: right }, menuClassName)}>
          {this.renderMenuItems()}
        </DropdownMenu>
      </Drd>
    );
  }
}
