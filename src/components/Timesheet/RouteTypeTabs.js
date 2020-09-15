import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import CommonTimesheetService from '../../services/timesheet/common';
import PageService from '../../services/PageService';
import { getTotalCounts } from '../../actions/timesheet/common';
import { Tabs } from './';

import './style.scss';

class RouteTypeTabs extends React.Component {
  static propTypes = {
    currentDate: PropTypes.any
  };

  static defaultProps = {
    currentDate: new Date()
  };

  constructor(props) {
    super(props);

    this.state = {
      sheetTabs: CommonTimesheetService.getSheetTabs()
    };
  }

  componentDidMount() {
    const { currentDate, getTotalCounts } = this.props;
    getTotalCounts({ currentDate });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { totalCounts, currentDate, isLoading, getTotalCounts } = this.props;
    const badge = key => (isLoading ? '• • •' : totalCounts[key] || null);

    if (!isEqual(totalCounts, prevProps.totalCounts)) {
      const sheetTabs = cloneDeep(this.state.sheetTabs).map(item => ({ ...item, badge: badge(item.key) }));
      this.setState({ sheetTabs });
    }

    if (currentDate !== prevProps.currentDate) {
      getTotalCounts({ currentDate });
    }
  }

  handleChangeActiveSheetTab = tabIndex => {
    const sheetTabs = cloneDeep(this.state.sheetTabs);

    sheetTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        PageService.changeUrlLink(tab.link);
      }
    });

    this.setState({ sheetTabs });
  };

  render() {
    const { sheetTabs } = this.state;

    return (
      <div className="ecos-timesheet__type">
        <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  totalCounts: get(state, 'timesheetCommon.totalCounts', false)
});

const mapDispatchToProps = dispatch => ({
  getTotalCounts: payload => dispatch(getTotalCounts(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RouteTypeTabs);
