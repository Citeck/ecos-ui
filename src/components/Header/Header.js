import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import ReactResizeDetector from 'react-resize-detector';

import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import { URL } from '../../constants';
import { MenuTypes } from '../../constants/menu';
import SlideMenuBtn from './SlideMenuBtn';
import CreateMenu from './CreateMenu';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import Search from './Search';
import LanguageSwitcher from './LanguageSwitcher';

import './style.scss';

const MenuSettings = lazy(() => import('../MenuSettings'));

const mapDispatchToProps = dispatch => ({
  fetchCreateCaseWidgetData: () => dispatch(fetchCreateCaseWidgetData()),
  fetchUserMenuData: () => dispatch(fetchUserMenuData()),
  fetchSiteMenuData: () => dispatch(fetchSiteMenuData())
});

const mapStateToProps = state => ({
  isMobile: get(state, 'view.isMobile'),
  theme: get(state, 'view.theme'),
  menuType: get(state, 'menu.type', ''),
  isOpenMenuSettings: get(state, 'menuSettings.isOpenMenuSettings', false)
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

    return menuType === MenuTypes.LEFT ? width : 0;
  }

  onResize = width => {
    this.setState({ widthHeader: width });
  };

  renderMenuSettings = () => {
    const { isOpenMenuSettings } = this.props;

    return isOpenMenuSettings ? (
      <Suspense fallback={null}>
        <MenuSettings />
      </Suspense>
    ) : null;
  };

  render() {
    const { widthHeader } = this.state;
    const { isMobile, hideSiteMenu, legacySiteMenuItems, theme } = this.props;
    const hiddenSiteMenu = hideSiteMenu || isMobile || widthHeader < 600;
    const hiddenLanguageSwitcher = isMobile || widthHeader < 600;

    return (
      <>
        {this.renderMenuSettings()}
        <ReactResizeDetector handleWidth handleHeight onResize={debounce(this.onResize, 400)} />
        <div className={classNames('ecos-header', `ecos-header_theme_${theme}`, { 'ecos-header_small': isMobile })}>
          <div className="ecos-header__side ecos-header__side_left">
            <SlideMenuBtn />
            <CreateMenu isMobile={widthHeader < 910} />
          </div>
          <div className="ecos-header__side ecos-header__side_right">
            <Search isMobile={isMobile || widthHeader <= 600} searchPageUrl={`${URL.JOURNAL}?journalId=search`} />
            {!hiddenSiteMenu && <SiteMenu legacyItems={legacySiteMenuItems} />}
            {!hiddenLanguageSwitcher && <LanguageSwitcher theme={theme} />}
            <UserMenu isMobile={widthHeader < 910} widthParent={widthHeader} />
          </div>
        </div>
      </>
    );
  }
}

Header.propTypes = {
  hideSiteMenu: PropTypes.bool,
  legacySiteMenuItems: PropTypes.array
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
