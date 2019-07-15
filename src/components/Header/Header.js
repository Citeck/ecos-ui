import React from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode } from '../../helpers/util';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import CreateMenu from './CreateMenu';
import UserMenu from './UserMenu';

import './style.scss';
import '../common/form/Dropdown/Dropdown.scss';

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
  isMobile: state.view.isMobile
});

class Header extends React.Component {
  componentDidMount() {
    this.props.fetchCreateCaseWidgetData();
    this.props.fetchUserMenuData();
    this.props.fetchSiteMenuData();
  }

  className = 'ecos-header';

  state = {
    isSmallMode: false
  };

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const { isSmallMode } = this.state;
    const { isMobile } = this.props;

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={this.className}>
          <div className={`${this.className}__side_left`}>
            <CreateMenu isSmallMode={isSmallMode} isMobile={isMobile} />
          </div>
          <div className={`${this.className}__side_right`}>
            <UserMenu isSmallMode={isSmallMode} isMobile={isMobile} />
            {/*
          <SiteMenu/>
          <Search/>*/}
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
