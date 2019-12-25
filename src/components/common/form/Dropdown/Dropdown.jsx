import React, { Component } from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';

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
    valueField: PropTypes.any,
    titleField: PropTypes.string,
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    toggleClassName: PropTypes.string,
    direction: PropTypes.string,
    hasEmpty: PropTypes.bool,
    right: PropTypes.bool,
    full: PropTypes.bool,
    isButton: PropTypes.bool,
    isStatic: PropTypes.bool,
    isLinks: PropTypes.bool,
    cascade: PropTypes.bool,
    withScrollbar: PropTypes.bool,
    hideSelected: PropTypes.bool,
    scrollbarHeightMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scrollbarHeightMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    CustomItem: PropTypes.element,
    getStateOpen: PropTypes.func
  };

  static defaultProps = {
    titleField: '',
    className: '',
    menuClassName: '',
    toggleClassName: '',
    direction: 'down',
    hasEmpty: false,
    isStatic: false,
    right: false,
    full: false,
    isLinks: false,
    cascade: false,
    hideSelected: false,
    withScrollbar: false,
    scrollbarHeightMin: '100%',
    scrollbarHeightMax: '100%',
    CustomItem: null,
    getStateOpen: () => null
  };

  constructor(props) {
    super(props);
    this.state = { dropdownOpen: false };
  }

  get selected() {
    const { valueField, source, value, hasEmpty } = this.props;

    return !isEmpty(source) ? source.find(item => item[valueField] === value) || (!hasEmpty && source[0]) : {};
  }

  toggle = () => {
    this.setState(
      {
        dropdownOpen: !this.state.dropdownOpen
      },
      () => {
        if (typeof this.props.getStateOpen == 'function') {
          this.props.getStateOpen(this.state.dropdownOpen);
        }
      }
    );
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
    const {
      valueField,
      titleField,
      source,
      value,
      hideSelected,
      CustomItem,
      withScrollbar,
      scrollbarHeightMin,
      scrollbarHeightMax
    } = this.props;
    const filteredSource = hideSelected ? source.filter(item => item[valueField] !== value) : source;
    let Wrapper = ({ children }) => <div>{children}</div>;

    if (withScrollbar) {
      Wrapper = ({ children }) => (
        <Scrollbars autoHeight autoHeightMin={scrollbarHeightMin} autoHeightMax={scrollbarHeightMax}>
          {children}
        </Scrollbars>
      );
    }

    return (
      <Wrapper>
        <ul>
          {filteredSource.map((item, i) =>
            CustomItem ? (
              <CustomItem key={item[valueField] || i} onClick={this.onChange} item={item} />
            ) : (
              <MenuItem key={item[valueField] || i} onClick={this.onChange} item={item}>
                {getPropByStringKey(item, titleField)}
              </MenuItem>
            )
          )}
        </ul>
      </Wrapper>
    );
  }

  render() {
    const {
      titleField,
      isStatic,
      right,
      full,
      isLinks,
      cascade,
      className,
      menuClassName,
      toggleClassName,
      children,
      direction
    } = this.props;
    const { dropdownOpen } = this.state;
    const cssClasses = classNames('ecos-dropdown', className, { 'ecos-dropdown_full-width': full });
    const cssDropdownMenu = classNames(
      'ecos-dropdown__menu',
      menuClassName,
      { 'ecos-dropdown__menu_right': right },
      { 'ecos-dropdown__menu_links': isLinks },
      { 'ecos-dropdown__menu_cascade': cascade }
    );
    const cssDropdownToggle = classNames('ecos-dropdown__toggle', toggleClassName);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle} direction={direction}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} className={cssDropdownToggle} tag="span">
          {isStatic ? children : this.getControl(getPropByStringKey(this.selected, titleField))}
        </DropdownToggle>
        <DropdownMenu className={cssDropdownMenu}>{this.renderMenuItems()}</DropdownMenu>
      </Drd>
    );
  }
}
