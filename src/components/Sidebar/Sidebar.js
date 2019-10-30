import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import { fetchLargeLogoSrc, fetchSlideMenuItems, fetchSmallLogoSrc, getSiteDashboardEnable, toggleIsOpen } from '../../actions/slideMenu';
import ULS from '../../services/userLocalSettings';
import Logo from './Logo';
import List from './List';

import './style.scss';

const isOpenMenu = () => {
  return get(ULS.getMenuMode(), 'isSlideMenuOpen', true);
};

const setOpenMenu = isSlideMenuOpen => {
  ULS.setMenuMode({
    ...ULS.getMenuMode(),
    isSlideMenuOpen
  });
};

class Sidebar extends React.Component {
  slideMenuToggle = null;

  componentDidMount() {
    this.props.fetchSmallLogoSrc();
    this.props.fetchLargeLogoSrc();
    this.props.fetchSlideMenuItems();
    this.props.toggleIsOpen(isOpenMenu());
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
    const { isOpen } = this.props;

    setOpenMenu(!isOpen);
    this.props.toggleIsOpen(!isOpen);
  };

  render() {
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items } = this.props;

    if (!isReady) {
      return null;
    }

    return (
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
          renderTrackVertical={props => <div {...props} className="ecos-sidebar-scroll_v" />}
        >
          <List data={items} />
        </Scrollbars>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isReady: state.slideMenu.isReady,
  items: state.slideMenu.items,
  smallLogoSrc: state.slideMenu.smallLogo,
  largeLogoSrc: state.slideMenu.largeLogo
});

const mapDispatchToProps = dispatch => ({
  fetchSmallLogoSrc: () => dispatch(fetchSmallLogoSrc()),
  fetchLargeLogoSrc: () => dispatch(fetchLargeLogoSrc()),
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  getSiteDashboardEnable: () => dispatch(getSiteDashboardEnable())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
