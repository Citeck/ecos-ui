import React, { lazy, Suspense } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  collapseAllItems,
  fetchLargeLogoSrc,
  fetchSlideMenuItems,
  fetchSmallLogoSrc,
  getSiteDashboardEnable,
  setInitExpandableItems,
  toggleIsOpen
} from '../../actions/slideMenu';
import Logo from './Logo';
import List from './List';

import './style.scss';

const MenuSettings = lazy(() => import('../MenuSettings'));

class Sidebar extends React.Component {
  slideMenuToggle = null;

  componentDidMount() {
    this.props.fetchSmallLogoSrc();
    this.props.fetchLargeLogoSrc();
    this.props.fetchSlideMenuItems();
    this.props.getSiteDashboardEnable();

    this.slideMenuToggle = document.getElementById('slide-menu-toggle');

    if (this.slideMenuToggle) {
      this.slideMenuToggle.addEventListener('click', this.toggleSlideMenu);
    }
  }

  componentWillUnmount() {
    if (this.slideMenuToggle) {
      this.slideMenuToggle.removeEventListener('click', this.toggleSlideMenu);
    }
  }

  toggleSlideMenu = () => {
    const isOpen = this.props.isOpen;

    this.props.toggleIsOpen(!isOpen);

    if (isOpen) {
      this.props.collapseAllItems();
    } else {
      this.props.setInitExpandableItems();
    }
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
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items } = this.props;

    if (!isReady) {
      return null;
    }

    return (
      <>
        {this.renderMenuSettings()}
        <div
          className={classNames('ecos-sidebar', {
            'ecos-sidebar_expanded': isOpen,
            'ecos-sidebar_collapsed': !isOpen
          })}
        >
          <div className={classNames('ecos-sidebar-head', { 'ecos-sidebar-head_expanded': isOpen })}>
            <Logo large={isOpen} logos={{ large: largeLogoSrc, small: smallLogoSrc }} />
          </div>
          <Scrollbars
            style={{ height: '100%' }}
            className="ecos-sidebar-scroll"
            autoHide
            renderTrackVertical={props => <div {...props} className="ecos-sidebar-scroll-v" />}
            renderTrackHorizontal={props => <div hidden />}
            renderView={props => <div {...props} className="ecos-sidebar-scroll-area" />}
          >
            <List items={items} isExpanded />
          </Scrollbars>
        </div>
      </>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isReady: state.slideMenu.isReady,
  items: state.slideMenu.items,
  smallLogoSrc: state.slideMenu.smallLogo,
  largeLogoSrc: state.slideMenu.largeLogo,
  expandableItems: state.slideMenu.expandableItems,
  isOpenMenuSettings: state.menuSettings.isOpenMenuSettings
});

const mapDispatchToProps = dispatch => ({
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  fetchSmallLogoSrc: () => dispatch(fetchSmallLogoSrc()),
  fetchLargeLogoSrc: () => dispatch(fetchLargeLogoSrc()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  getSiteDashboardEnable: () => dispatch(getSiteDashboardEnable()),
  setInitExpandableItems: () => dispatch(setInitExpandableItems()),
  collapseAllItems: () => dispatch(collapseAllItems())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
