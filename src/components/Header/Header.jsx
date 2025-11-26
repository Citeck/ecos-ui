import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';

import { AIAssistantButton } from '../AIAssistant';

import CreateMenu from './CreateMenu';
import LanguageSwitcher from './LanguageSwitcher';
import Search from './Search';
import SiteMenu from './SiteMenu';
import SlideMenuButton from './SlideMenuButton';
import UserMenu from './UserMenu';
import WorkspacesSwitcher from './Workspaces';

import { JournalUrlParams, URL } from '@/constants';
import { MenuTypes } from '@/constants/menu';
import { selectIsViewNewJournal } from '@/selectors/view';
import ConfigService, { ALFRESCO_ENABLED } from '@/services/config/ConfigService';

import './style.scss';

const MenuSettings = lazy(() => import('../MenuSettings'));

const mapStateToProps = state => ({
  menuId: get(state, 'menu.id'),
  isMobile: get(state, 'view.isMobile'),
  theme: get(state, 'view.theme'),
  menuType: get(state, 'menu.type', ''),
  isOpenMenuSettings: get(state, 'menuSettings.isOpenMenuSettings', false),
  isViewNewJournal: selectIsViewNewJournal(state)
});

class Header extends React.Component {
  state = {
    hasAlfresco: false,
    widthHeader: 0
  };

  componentDidMount() {
    ConfigService.getValue(ALFRESCO_ENABLED).then(value => {
      this.setState({
        hasAlfresco: value
      });
    });
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
    const { widthHeader, hasAlfresco } = this.state;
    const { isMobile, hideSiteMenu, legacySiteMenuItems, theme, isViewNewJournal } = this.props;
    const hiddenSiteMenu = hideSiteMenu || isMobile || widthHeader < 600;
    const hiddenLanguageSwitcher = isMobile || widthHeader < 600;

    return (
      <>
        {this.renderMenuSettings()}
        <ReactResizeDetector handleWidth handleHeight onResize={debounce(this.onResize, 400)} />
        <div
          className={classNames('ecos-header', `ecos-header_theme_${theme}`, {
            'ecos-header_small': isMobile,
            'ecos-header_new': isViewNewJournal
          })}
        >
          <div className="ecos-header__side ecos-header__side_left">
            {get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) ? <WorkspacesSwitcher /> : <SlideMenuButton />}
            <CreateMenu isMobile={widthHeader < 910} />
          </div>
          <div className="ecos-header__side ecos-header__side_right">
            <AIAssistantButton />
            <Search
              hasAlfresco
              isMobile={isMobile || widthHeader <= 600}
              searchPageUrl={`${URL.JOURNAL}?${JournalUrlParams.JOURNAL_ID}=search`}
            />
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

export default connect(mapStateToProps)(Header);
