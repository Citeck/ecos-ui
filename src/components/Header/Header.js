import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode as defineSmallMode } from '../../helpers/util';
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
    isSmallMode: false
  };

  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  onResize = width => {
    const isSmallMode = defineSmallMode(width);

    this.setState({ isSmallMode });
  };

  render() {
    const { isSmallMode } = this.state;
    const { isMobile, userPhotoUrl } = this.props;
    const classNameContainer = classNames(this.className, { [`${this.className}_small`]: isMobile || isSmallMode });
    const classNameSide = `${this.className}__side`;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={classNameContainer}>
          <div className={`${classNameSide} ${classNameSide}_left`}>
            <CreateMenu isSmallMode={isSmallMode} isMobile={isMobile} />
          </div>
          <div className={`${classNameSide} ${classNameSide}_right`}>
            <Search isSmallMode={isSmallMode} isMobile={isMobile} />
            {!(isSmallMode || isMobile) && <SiteMenu />}
            <Avatar url={userPhotoUrl} />
            <UserMenu isSmallMode={isSmallMode} isMobile={isMobile} />
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
