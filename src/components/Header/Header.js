import React from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import { isEmpty } from 'lodash';
import { isSmallMode } from '../../helpers/util';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import CreateMenu from './CreateMenu';
import UserMenu from './UserMenu';
import SiteMenu from './SiteMenu';
import Search from './Search';

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
  userPhotoUrl: state.user.thumbnail
});

class Header extends React.Component {
  className = 'ecos-header';

  state = {
    isSmallMode: false
  };

  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  renderUserPhoto() {
    const { userPhotoUrl } = this.props;
    const className = `${this.className}__user-photo`;

    return (
      <div className={className}>
        {isEmpty(userPhotoUrl) ? (
          <i className={`${className}-icon icon-User_avatar`} />
        ) : (
          <div className={`${className}-image`} style={{ backgroundImage: 'url(' + userPhotoUrl + ')' }} />
        )}
      </div>
    );
  }

  render() {
    const { isSmallMode } = this.state;
    const { isMobile } = this.props;
    const classNameSide = `${this.className}__side`;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={this.className}>
          <div className={`${classNameSide} ${classNameSide}_left`}>
            <CreateMenu isSmallMode={isSmallMode} isMobile={isMobile} />
          </div>
          <div className={`${classNameSide} ${classNameSide}_right`}>
            <Search isSmallMode={isSmallMode} isMobile={isMobile} />
            {!(isSmallMode || isMobile) && <SiteMenu />}
            {!(isSmallMode || isMobile) && this.renderUserPhoto()}
            <UserMenu />
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
