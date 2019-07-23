import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import { Avatar } from '../common';
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
    widthHeader: 0
  };

  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  onResize = widthHeader => {
    this.setState({ widthHeader });
  };

  render() {
    const { widthHeader } = this.state;
    const { isMobile, userPhotoUrl } = this.props;
    const classNameContainer = classNames(this.className, { [`${this.className}_small`]: isMobile });
    const classNameSide = `${this.className}__side`;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={classNameContainer}>
          <div className={`${classNameSide} ${classNameSide}_left`}>
            <CreateMenu isMobile={isMobile} />
          </div>
          <div className={`${classNameSide} ${classNameSide}_right`}>
            <Search isMobile={isMobile} />
            {!isMobile && <SiteMenu />}
            <Avatar url={userPhotoUrl} />
            <UserMenu isMobile={isMobile} widthParent={widthHeader} />
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
