import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { isArray, isEmpty } from 'lodash';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { goToPageFromSiteMenu } from '../../actions/header';
import IcoBtn from '../common/btns/IcoBtn';
import Icon from '../common/icons/Icon/Icon';
import { DropdownMenu as Menu } from '../common';

const mapStateToProps = state => ({
  items: state.header.siteMenu.items
});

const mapDispatchToProps = dispatch => ({
  goToPage: payload => dispatch(goToPageFromSiteMenu(payload))
});

class SiteMenu extends React.Component {
  static propTypes = {
    items: PropTypes.array.isRequired
  };

  static defaultProps = {
    items: []
  };

  className = 'ecos-header-site';

  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  handelItem = data => {
    this.toggle();
    this.props.goToPage(data);
  };

  render() {
    const { dropdownOpen } = this.state;
    const { items } = this.props;
    const disabled = isEmpty(items) || !isArray(items);
    const classNameIcoBtn = classNames(
      `${this.className}__btn  ecos-btn_hover_t-blue ecos-btn_tight`,
      { 'ecos-btn_blue': !dropdownOpen },
      { 'ecos-btn_blue2': dropdownOpen }
    );

    return (
      <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn invert={true} icon={'icon-down'} className={classNameIcoBtn} disabled={disabled}>
            <Icon className={'icon-settings'} />
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right`}>
          <Menu items={items} onClick={this.handelItem} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteMenu);
