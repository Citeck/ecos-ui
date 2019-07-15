import React from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode } from '../../helpers/util';
import { fetchCreateCaseWidgetData, fetchSiteMenuData, fetchUserMenuData } from '../../actions/header';
import CreateCaseBtn from './CreateCaseBtn';

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

    return (
      <React.Fragment>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
        <div className={this.className}>
          <div className={`${this.className}__side_left`}>
            <CreateCaseBtn isSmallMode={isSmallMode} />
          </div>
          <div className={`${this.className}__side_right`}>{/*<UserMenu/>
          <SiteMenu/>
          <Search/>*/}</div>
        </div>
      </React.Fragment>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(Header);
