import React, { Component } from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';

import DashboardSettings, { mapStateToProps, mapDispatchToProps } from './DashboardSettings';
import pageTabList from '../../services/pageTabs/PageTabList';
import Settings from './Settings';

class DashboardSettingsModal extends Settings {
  constructor(props) {
    super(props);
  }

  fetchData(props = this.props) {
    const { initSettings } = props;
    let { recordRef, dashboardId } = props;

    if (isEmpty(recordRef)) {
      recordRef = get(this.getPathInfo(), 'recordRef');
    }

    if (isEmpty(dashboardId)) {
      dashboardId = get(this.getPathInfo(), 'dashboardId');
    }

    console.warn({ recordRef, dashboardId, props });

    // if (!dashboardId || !pageTabList.isActiveTab(props.tabId)) {
    //   return;
    // }

    initSettings({ recordRef, dashboardId });
  }

  // render() {
  //   return (
  //     <div>
  //
  //     </div>
  //   );
  // }
}

// export default DashboardSettingsModal;
// export default connect()(DashboardSettingsModal);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    // areStatePropsEqual: next => !next.isActive
  }
)(DashboardSettingsModal);
