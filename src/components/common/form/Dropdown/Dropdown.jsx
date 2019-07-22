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
    titleField: PropTypes.string,
    valueField: PropTypes.any,
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    tag: PropTypes.string,
    direction: PropTypes.string,
    isItemComponent: PropTypes.bool,
    hasEmpty: PropTypes.bool,
    isStatic: PropTypes.bool,
    right: PropTypes.bool
  };

  static defaultProps = {
    titleField: '',
    className: '',
    menuClassName: '',
    tag: 'span',
    direction: '',
    isItemComponent: false,
    hasEmpty: false,
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
    const { valueField, titleField, source, isItemComponent, value, isStatic, hasEmpty, hideSelected } = this.props;

    const selected = source.find(item => item[valueField] === value) || (!hasEmpty && source[0]) || {};
    const filteredSource = hideSelected ? source.filter(item => item[valueField] !== value) : source;

    return (
      <ul>
        {filteredSource.map(item => {
          return isItemComponent ? (
            item
          ) : (
            <MenuItem key={item[valueField]} onClick={this.onChange} item={item}>
              {getPropByStringKey(item, titleField)}
            </MenuItem>
          );
        })}
      </ul>
    );
  }

  render() {
    const { titleField, isStatic, right, className, menuClassName, children, tag, direction } = this.props;
    const { dropdownOpen } = this.state;
    const cssClasses = classNames(this.className, className);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle} direction={direction}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} tag={tag}>
          {isStatic ? children : this.getControl(getPropByStringKey(this.selected, titleField))}
        </DropdownToggle>

        <DropdownMenu className={classNames(`${this.className}__menu`, { [`${this.className}__menu_right`]: right }, menuClassName)}>
          {this.renderMenuItems()}
        </DropdownMenu>
      </Drd>
    );
  }
}

Dropdown.propTypes = {
  isStatic: PropTypes.bool,
  hideSelected: PropTypes.bool
};

Dropdown.defaultProps = {
  hideSelected: false
};
