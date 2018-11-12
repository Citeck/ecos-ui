import React from 'react';
import { connect } from 'react-redux';
import CreateCaseWidget from './CreateCaseWidget';
import Search from './Search';
import SiteMenu from './SiteMenu';
import UserMenu from './UserMenu';
import { fetchCreateCaseWidgetData, fetchUserMenuData, fetchSiteMenuData } from '../../actions/header';

import './share-header.css';

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

class Header extends React.Component {
  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  render() {
    return (
      <div id="SHARE_HEADER" className="alfresco-header-Header">
        <div className="alfresco-layout-LeftAndRight__left">
          {/* It is just a hack for the old slide menu hamburger rendering */}
          <div id="HEADER_APP_MENU_BAR">
            <div />
          </div>

          <CreateCaseWidget />
        </div>
        <div className="alfresco-layout-LeftAndRight__right">
          <UserMenu />
          <SiteMenu />
          <Search />
        </div>
      </div>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(Header);
