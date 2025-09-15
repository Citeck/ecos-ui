import classNames from 'classnames';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import WorkspacePreview from '../WorkspacePreview';
import { Tooltip } from '../common';
import SidebarToggle from '../common/icons/SidebarToggle';

import List from './List';
import Logo from './Logo';
import MobileMenuBtn from './MobileMenuBtn';

import {
  collapseAllItems,
  fetchSlideMenuItems,
  getSiteDashboardEnable,
  setExpandableItems,
  setInitialSelectedId,
  toggleIsOpen
} from '@/actions/slideMenu';
import { URL as Urls } from '@/constants';
import { DefaultImages } from '@/constants/theme';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, isExistValue, t } from '@/helpers/util';
import { selectActiveThemeImage, selectIsViewNewJournal } from '@/selectors/view';
import { selectWorkspaceById } from '@/selectors/workspaces';
import PageService, { Events } from '@/services/PageService';

import './style.scss';

class Sidebar extends React.Component {
  static propTypes = {
    idMenu: PropTypes.string,
    versionMenu: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isOpen: PropTypes.bool,
    isReady: PropTypes.bool,
    items: PropTypes.array,
    smallLogoSrc: PropTypes.string,
    largeLogoSrc: PropTypes.string,
    expandableItems: PropTypes.array,
    homeLink: PropTypes.string,
    locationKey: PropTypes.string,
    fetchSlideMenuItems: PropTypes.func,
    toggleIsOpen: PropTypes.func,
    getSiteDashboardEnable: PropTypes.func,
    setExpandableItems: PropTypes.func,
    collapseAllItems: PropTypes.func,
    setInitialSelectedId: PropTypes.func
  };

  state = {
    fetchItems: false
  };

  componentDidMount() {
    this.init();
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.props.setInitialSelectedId);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { idMenu, isReady } = this.props;
    this.fetchItems();

    if (!prevProps.isReady && isReady && this.slideMenuToggle) {
      this.slideMenuToggle.addEventListener('click', this.toggleSlideMenu);
    }

    if (prevProps.idMenu !== idMenu) {
      this.init(true);
    }
  }

  componentWillUnmount() {
    document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, this.props.setInitialSelectedId);
  }

  scrollToActiveItem = () => {
    const item = document.getElementsByClassName('ecos-sidebar-item_selected')[0];
    item &&
      item.scrollIntoView({
        block: 'center'
      });
  };

  init(forceState = false) {
    this.slideMenuToggle = document.getElementById('slide-menu-toggle');

    const { getSiteDashboardEnable, setInitialSelectedId } = this.props;

    getSiteDashboardEnable();
    this.fetchItems(forceState);

    setInitialSelectedId();
  }

  fetchItems(forceState, forceFetching) {
    if ((isExistValue(this.props.versionMenu) && !this.state.fetchItems) || forceState) {
      this.setState({ fetchItems: true }, () => {
        this.props.fetchSlideMenuItems(forceFetching);
      });
    }
  }

  toggleSlideMenu = () => {
    const isOpen = this.props.isOpen;

    this.props.toggleIsOpen(!isOpen);

    if (isOpen) {
      this.props.collapseAllItems();
    } else {
      this.props.setExpandableItems(true);
    }
  };

  render() {
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items, id, isViewNewJournal, workspace, isMobile } = this.props;
    const { homePageLink, id: wsId, name: wsName, image: wsImage } = workspace || {};

    if (!isReady) {
      return null;
    }

    const url = new URL(homePageLink || Urls.DASHBOARD, window.location.origin);

    if (workspace && getEnabledWorkspaces()) {
      url.searchParams.set('ws', wsId);
    }

    const workspaceHomeLink = url.toString();

    if (!isOpen && isMobile) {
      return <MobileMenuBtn openMenu={this.toggleSlideMenu} />;
    }

    return (
      <div
        id={id}
        className={classNames('ecos-sidebar', {
          'ecos-sidebar_expanded': isOpen,
          'ecos-sidebar_collapsed': !isOpen,
          'ecos-sidebar_new': isViewNewJournal,
          'ecos-sidebar_new_expanded': isViewNewJournal && isOpen,
          'ecos-sidebar_new_collapsed': isViewNewJournal && !isOpen
        })}
      >
        <div id={`${id}-logo`} className={classNames('ecos-sidebar-head', { 'ecos-sidebar-head_expanded': isOpen })}>
          <Logo large={isOpen} logos={{ large: largeLogoSrc, small: smallLogoSrc }} link={workspaceHomeLink} />
          {workspace && (
            <div
              onClick={() => {
                if (!wsId) {
                  return;
                }

                PageService.changeUrlLink(workspaceHomeLink, { openNewTab: true, closeActiveTab: false });
              }}
            >
              <Tooltip uncontrolled target={`${id}-logo`} text={wsName} hideArrow placement="bottom-end">
                <WorkspacePreview url={wsImage} name={wsName} hovered={wsId.length} />
              </Tooltip>
            </div>
          )}
        </div>
        <Scrollbars
          style={{ height: '100%' }}
          className="ecos-sidebar-scroll"
          autoHide
          renderTrackVertical={props => <div {...props} className="ecos-sidebar-scroll-v" />}
          renderTrackHorizontal={() => <div hidden />}
          renderView={props => <div {...props} className="ecos-sidebar-scroll-area" />}
        >
          <List items={items} workspace={workspace} isExpanded />
        </Scrollbars>
        {get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) && (
          <div className="ecos-sidebar-toggle" onClick={() => this.toggleSlideMenu()}>
            <SidebarToggle color="#b7b7b7" />
            {isOpen && <p>{t('admin-section.sidebar.hide-sm')}</p>}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const workspaceId = getWorkspaceId();

  return {
    isMobile: !!get(state, 'view.isMobile'),
    idMenu: get(state, 'menu.id', ''),
    versionMenu: get(state, 'menu.version'),
    isOpen: get(state, 'slideMenu.isOpen'),
    isReady: get(state, 'slideMenu.isReady'),
    items: get(state, 'slideMenu.items', []),
    smallLogoSrc: selectActiveThemeImage(state, DefaultImages.MENU_LEFT_LOGO_SMALL),
    largeLogoSrc: selectActiveThemeImage(state, DefaultImages.MENU_LEFT_LOGO_LARGE),
    workspace: selectWorkspaceById(state, workspaceId),
    expandableItems: get(state, 'slideMenu.expandableItems'),
    homeLink: get(state, 'app.homeLink'),
    locationKey: get(state, 'router.location.key'),
    isViewNewJournal: selectIsViewNewJournal(state),
    selectedId: get(state, 'slideMenu.selectedId')
  };
};

const mapDispatchToProps = dispatch => ({
  fetchSlideMenuItems: forceFetch => dispatch(fetchSlideMenuItems({ forceFetch })),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  getSiteDashboardEnable: () => dispatch(getSiteDashboardEnable()),
  setExpandableItems: force => dispatch(setExpandableItems({ force })),
  collapseAllItems: () => dispatch(collapseAllItems()),
  setInitialSelectedId: () => dispatch(setInitialSelectedId())
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
