import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import ReactResizeDetector from 'react-resize-detector';

import { MENU_TYPE, URL } from '../../constants';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';

import SlideMenuBtn from './SlideMenuBtn';
import CreateMenu from './CreateMenu';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import Search from './Search';
import LanguageSwitcher from './LanguageSwitcher';

import './style.scss';

const mapDispatchToProps = dispatch => ({
  fetchCreateCaseWidgetData: () => dispatch(fetchCreateCaseWidgetData()),
  fetchUserMenuData: () => dispatch(fetchUserMenuData()),
  fetchSiteMenuData: () => dispatch(fetchSiteMenuData())
});

const mapStateToProps = state => ({
  isMobile: get(state, 'view.isMobile'),
  theme: get(state, 'view.theme'),
  menuType: get(state, 'menu.type', '')
});

class Header extends React.Component {
  state = {
    widthHeader: 0
  };

  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  get menuWidth() {
    const { menuType } = this.props;
    const menuSelector = document.querySelector('.slide-menu');
    const width = (menuSelector && menuSelector.clientWidth) || 0;

    return menuType === MENU_TYPE.LEFT ? width : 0;
  }

  onResize = width => {
    this.setState({ widthHeader: width });
  };

  render() {
    const { widthHeader } = this.state;
    const { isMobile, hideSiteMenu, theme } = this.props;
    const hiddenSiteMenu = hideSiteMenu || isMobile || widthHeader < 600;
    const hiddenLanguageSwitcher = isMobile || widthHeader < 600;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={debounce(this.onResize, 400)} />
        <div className={classNames('ecos-header', `ecos-header_theme_${theme}`, { 'ecos-header_small': isMobile })}>
          <div className="ecos-header__side ecos-header__side_left">
            <SlideMenuBtn />
            <CreateMenu isMobile={widthHeader < 910} />
          </div>
          <div className="ecos-header__side ecos-header__side_right">
            <Search isMobile={widthHeader <= 600} searchPageUrl={`${URL.JOURNAL}?journalId=search`} />
            {!hiddenSiteMenu && <SiteMenu />}
            {!hiddenLanguageSwitcher && <LanguageSwitcher theme={theme} />}
            <UserMenu isMobile={widthHeader < 910} widthParent={widthHeader} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

Header.propTypes = {
  hideSiteMenu: PropTypes.bool
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
