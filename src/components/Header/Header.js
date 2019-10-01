import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import CreateMenu from './CreateMenu';
import HamburgerIcon from './HamburgerIcon';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import Search from './Search';
import LanguageSwitcher from './LanguageSwitcher';
import { MENU_TYPE } from '../../constants';

import './style.scss';

const mapDispatchToProps = dispatch => ({
  fetchCreateCaseWidgetData: () => {
    dispatch(fetchCreateCaseWidgetData());
  },
  fetchUserMenuData: () => {
    dispatch(fetchUserMenuData());
  },
  fetchSiteMenuData: () => {
    dispatch(fetchSiteMenuData());
  }
});

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  menuType: state.menu.type
});

class Header extends React.Component {
  className = 'ecos-header';

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
    const widthHeader = width >= 550 ? width + this.menuWidth : width;

    this.setState({ widthHeader });
  };

  render() {
    const { widthHeader } = this.state;
    const { isMobile } = this.props;
    const classNameContainer = classNames(this.className, { [`${this.className}_small`]: isMobile });
    const classNameSide = `${this.className}__side`;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={classNameContainer}>
          <div className={`${classNameSide} ${classNameSide}_left`}>
            <HamburgerIcon />
            <CreateMenu isMobile={widthHeader < 910} />
          </div>
          <div className={`${classNameSide} ${classNameSide}_right`}>
            <Search isMobile={widthHeader <= 600} />
            {isMobile || (widthHeader > 600 && <LanguageSwitcher />)}
            {isMobile || (widthHeader > 600 && <SiteMenu />)}
            <UserMenu isMobile={widthHeader < 910} widthParent={widthHeader} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
