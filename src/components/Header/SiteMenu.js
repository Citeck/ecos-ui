import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { isArray, isEmpty } from 'lodash';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { goToPageFromSiteMenu } from '../../actions/header';
import IcoBtn from '../common/btns/IcoBtn';
import Icon from '../common/icons/Icon/Icon';
import CustomDropdownMenu from '../common/DropdownMenu/DropdownMenu';

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

  render() {
    const { dropdownOpen } = this.state;
    const { items, goToPage, isSmallMode, isMobile } = this.props;
    const disabled = isEmpty(items) || !isArray(items);
    const classNameIcoBtn = classNames(
      `${this.className}__btn  ecos-btn_hover_t-blue ecos-btn_tight`,
      { 'ecos-btn_blue': !dropdownOpen },
      { 'ecos-btn_blue2': dropdownOpen }
    );

    return (
      <div className={`${this.className}__container`}>
        <Dropdown className={`ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div">
            {!(isSmallMode || isMobile) && (
              <IcoBtn invert={true} icon={'icon-down'} className={classNameIcoBtn} disabled={disabled}>
                <Icon className={'icon-settings'} />
              </IcoBtn>
            )}
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right`}>
            <CustomDropdownMenu
              items={items}
              onClick={data => {
                this.toggle();
                goToPage(data);
              }}
            />
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteMenu);
