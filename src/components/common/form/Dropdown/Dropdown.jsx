import React, { Component } from 'react';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { Scrollbars } from 'react-custom-scrollbars';

import { IcoBtn, TwoIcoBtn } from '../../btns';
import { getPropByStringKey, getTextByLocale } from '../../../../helpers/util';

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
    keyFields: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    toggleClassName: PropTypes.string,
    controlClassName: PropTypes.string,
    controlLabel: PropTypes.string,
    controlIcon: PropTypes.string,
    direction: PropTypes.string,
    placeholder: PropTypes.string,
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
    controlClassName: '',
    placeholder: '',
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

  get cssDropdownMenu() {
    const { right, isLinks, cascade, menuClassName } = this.props;

    return classNames(
      'ecos-dropdown__menu',
      menuClassName,
      { 'ecos-dropdown__menu_right': right },
      { 'ecos-dropdown__menu_links': isLinks },
      { 'ecos-dropdown__menu_cascade': cascade }
    );
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
    const { controlClassName, children, placeholder, hasEmpty, isButton, value } = this.props;
    const { dropdownOpen } = this.state;
    let label = text;

    if (!children) {
      if (placeholder && hasEmpty && !value) {
        label = placeholder;
      }

      return (
        <IcoBtn
          className={classNames('ecos-dropdown__toggle_selected', controlClassName)}
          invert
          icon={dropdownOpen ? 'icon-small-up' : 'icon-small-down'}
        >
          {label}
        </IcoBtn>
      );
    }

    return React.Children.map(children, child => {
      return React.cloneElement(child, {
        children: isButton ? child.props.children || '' : label
      });
    });
  };

  getStaticControl = () => {
    const { children, controlLabel = '', controlIcon = '', controlClassName } = this.props;
    const { dropdownOpen } = this.state;

    if (!children) {
      return (
        <TwoIcoBtn
          icons={[controlIcon, dropdownOpen ? 'icon-small-up' : 'icon-small-down']}
          label={controlLabel}
          className={classNames('ecos-dropdown__toggle_static', controlClassName)}
        >
          <span className="ecos-dropdown__toggle-label">{controlLabel}</span>
        </TwoIcoBtn>
      );
    }

    return React.Children.map(children, child => React.cloneElement(child, { children: child.props.children }));
  };

  getKey = (item, index) => {
    const { keyFields, valueField } = this.props;

    if (isEmpty(keyFields)) {
      return item[valueField] || index;
    }

    if (typeof keyFields === 'string') {
      return item[keyFields] || index;
    }

    if (Array.isArray(keyFields)) {
      return keyFields.map(key => `${item[key]}`).join('-');
    }

    return index;
  };

  onChange = selected => {
    const { onChange } = this.props;

    if (typeof onChange === 'function') {
      onChange(selected);
    }

    this.toggle();
  };

  renderToggle() {
    const { titleField, isStatic } = this.props;

    return isStatic ? this.getStaticControl() : this.getControl(getPropByStringKey(this.selected, titleField));
  }

  renderMenuItems() {
    const { valueField, source, value, hideSelected, withScrollbar, scrollbarHeightMin, scrollbarHeightMax } = this.props;
    const filteredSource = hideSelected ? source.filter(item => item[valueField] !== value) : source;
    let Wrapper = ({ children }) => <div>{children}</div>;

    if (withScrollbar) {
      Wrapper = ({ children }) => (
        <Scrollbars autoHeight autoHeightMin={scrollbarHeightMin} autoHeightMax={scrollbarHeightMax || '100%'}>
          {children}
        </Scrollbars>
      );
    }

    return (
      <Wrapper>
        <ul>{filteredSource.map(this.renderMenuItem)}</ul>
      </Wrapper>
    );
  }

  renderMenuItem = (item, i) => {
    const { CustomItem, titleField } = this.props;

    if (CustomItem) {
      return <CustomItem key={this.getKey(item, i)} onClick={this.onChange} item={item} />;
    }

    const text = getPropByStringKey(item, titleField);

    return (
      <MenuItem key={this.getKey(item, i)} onClick={this.onChange} item={item}>
        {getTextByLocale(text)}
      </MenuItem>
    );
  };

  render() {
    const { full, className, toggleClassName, direction } = this.props;
    const { dropdownOpen } = this.state;
    const cssClasses = classNames('ecos-dropdown', className, { 'ecos-dropdown_full-width': full });
    const cssDropdownToggle = classNames('ecos-dropdown__toggle', toggleClassName);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle} direction={direction}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} className={cssDropdownToggle} tag="span">
          {this.renderToggle()}
        </DropdownToggle>
        <DropdownMenu className={this.cssDropdownMenu}>{this.renderMenuItems()}</DropdownMenu>
      </Drd>
    );
  }
}
