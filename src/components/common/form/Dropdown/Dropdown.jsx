import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { Dropdown as Drd, DropdownMenu, DropdownToggle } from 'reactstrap';
import uuidV4 from 'uuid/v4';

import { getIconUpDown } from '../../../../helpers/icon';
import { getPropByStringKey, getTextByLocale, isMobileDevice } from '../../../../helpers/util';
import { Tooltip } from '../../../common';
import { IcoBtn, TwoIcoBtn } from '../../btns';

import MenuItem from './MenuItem';

import './Dropdown.scss';

export default class Dropdown extends Component {
  static propTypes = {
    valueField: PropTypes.any,
    titleField: PropTypes.string,
    keyFields: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    className: PropTypes.string,
    menuClassName: PropTypes.string,
    itemClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
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
    source: PropTypes.array,
    isStatic: PropTypes.bool,
    isLinks: PropTypes.bool,
    cascade: PropTypes.bool,
    withScrollbar: PropTypes.bool,
    hideSelected: PropTypes.bool,
    scrollbarHeightMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scrollbarHeightMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    CustomItem: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
    getStateOpen: PropTypes.func,
    onChange: PropTypes.func,
    labelIsDiv: PropTypes.bool,
    otherFuncForCustomItem: PropTypes.object,
    wrapperClassName: PropTypes.string
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
    getStateOpen: () => null,
    labelIsDiv: false
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
    const { right, isLinks, cascade, menuClassName, isViewNewJournal } = this.props;

    return classNames(
      'ecos-dropdown__menu',
      menuClassName,
      { 'ecos-dropdown__menu_new': isViewNewJournal },
      { 'ecos-dropdown__menu_right': right },
      { 'ecos-dropdown__menu_links': isLinks },
      { 'ecos-dropdown__menu_cascade': cascade }
    );
  }

  toggle = () => {
    this.setState(
      { dropdownOpen: !this.state.dropdownOpen },
      () => isFunction(this.props.getStateOpen) && this.props.getStateOpen(this.state.dropdownOpen)
    );
  };

  getControl = text => {
    const { controlClassName, children, placeholder, hasEmpty, isButton, value } = this.props;
    const { dropdownOpen } = this.state;
    let label = getTextByLocale(text);

    if (!children) {
      if (placeholder && hasEmpty && !value) {
        label = placeholder;
      }

      return (
        <IcoBtn className={classNames('ecos-dropdown__toggle_selected', controlClassName)} invert icon={getIconUpDown(dropdownOpen)}>
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

  getLabel = () => {
    const { labelIsDiv, controlLabel = '' } = this.props;

    if (!labelIsDiv) {
      return <span className="ecos-dropdown__toggle-label">{controlLabel}</span>;
    }

    if (labelIsDiv) {
      return (
        <div className="ecos-dropdown__toggle-label" title={controlLabel}>
          {controlLabel}
        </div>
      );
    }
  };

  getStaticControl = () => {
    const { children, controlLabel = '', controlIcon = '', controlClassName } = this.props;
    const { dropdownOpen } = this.state;

    if (!children) {
      return (
        <TwoIcoBtn
          icons={[controlIcon, getIconUpDown(dropdownOpen)]}
          label={controlLabel}
          className={classNames('ecos-dropdown__toggle_static', controlClassName)}
        >
          {controlLabel && this.getLabel()}
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
      return keyFields.map(key => item[key]).join('-');
    }

    return index;
  };

  onChange = selected => {
    const { onChange } = this.props;

    isFunction(onChange) && onChange(selected);
    this.toggle();
  };

  renderToggle() {
    const { titleField, isStatic } = this.props;

    return isStatic ? this.getStaticControl() : this.getControl(getPropByStringKey(this.selected, titleField));
  }

  renderMenuItems = React.memo(() => {
    const {
      valueField,
      source = [],
      value,
      hideSelected,
      withScrollbar,
      scrollbarHeightMin,
      scrollbarHeightMax,
      wrapperClassName
    } = this.props;
    const filteredSource = hideSelected ? source.filter(item => item[valueField] !== value) : source;
    let Wrapper = ({ children }) => <div className={wrapperClassName}>{children}</div>;

    if (withScrollbar) {
      Wrapper = ({ children }) => (
        <Scrollbars
          autoHeight
          autoHeightMin={scrollbarHeightMin}
          autoHeightMax={scrollbarHeightMax || '100%'}
          className={wrapperClassName}
          renderView={props => <div {...props} className="ecos-dropdown__scrollbar" />}
        >
          {children}
        </Scrollbars>
      );
    }

    return (
      <Wrapper>
        <ul>{filteredSource.map(this.renderMenuItem)}</ul>
      </Wrapper>
    );
  });

  renderMenuItem = (item, i) => {
    const { CustomItem, titleField, valueField, value, itemClassName, otherFuncForCustomItem } = this.props;

    if (CustomItem) {
      return <CustomItem key={this.getKey(item, i)} onClick={this.onChange} item={item} {...otherFuncForCustomItem} />;
    }

    const text = getPropByStringKey(item, titleField);
    const className = isFunction(itemClassName) ? itemClassName(item) : itemClassName;
    const selected = item[valueField] === value;
    const targetId = 'dropdown-menu-item_' + uuidV4();

    return (
      <MenuItem key={this.getKey(item, i)} id={targetId} onClick={this.onChange} item={item} selected={selected} className={className}>
        <Tooltip uncontrolled showAsNeeded target={targetId} text={getTextByLocale(text)} off={isMobileDevice()}>
          {getTextByLocale(text)}
        </Tooltip>
      </MenuItem>
    );
  };

  render() {
    const { full, className, toggleClassName, direction, disabled } = this.props;
    const { dropdownOpen } = this.state;

    const cssClasses = classNames('ecos-dropdown', className, { 'ecos-dropdown_full-width': full });
    const cssDropdownToggle = classNames('ecos-dropdown__toggle', toggleClassName);

    return (
      <Drd className={cssClasses} isOpen={dropdownOpen} toggle={this.toggle} direction={direction} disabled={disabled}>
        <DropdownToggle onClick={this.toggle} data-toggle="dropdown" aria-expanded={dropdownOpen} className={cssDropdownToggle} tag="span">
          {this.renderToggle()}
        </DropdownToggle>
        <DropdownMenu className={this.cssDropdownMenu}>
          <this.renderMenuItems />
        </DropdownMenu>
      </Drd>
    );
  }
}
