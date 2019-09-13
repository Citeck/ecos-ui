import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { MENU_TYPE } from '../../constants';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';

import SlideMenuBtn from './SlideMenuBtn';
import CreateMenu from './CreateMenu';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import Search from './Search';

import './style.scss';

const mapDispatchToProps = dispatch => ({
  fetchCreateCaseWidgetData: () => dispatch(fetchCreateCaseWidgetData()),
  fetchUserMenuData: () => dispatch(fetchUserMenuData()),
  fetchSiteMenuData: () => dispatch(fetchSiteMenuData())
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
    this.setState({ widthHeader: width });
  };

  render() {
    const { widthHeader } = this.state;
    const { isMobile } = this.props;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={classNames('ecos-header', { 'ecos-header_small': isMobile })}>
          <div className="ecos-header__side ecos-header__side_left">
            <SlideMenuBtn />
            <CreateMenu isMobile={widthHeader < 910} />
          </div>
          <div className="ecos-header__side ecos-header__side_right">
            <Search isMobile={widthHeader <= 600} />
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
