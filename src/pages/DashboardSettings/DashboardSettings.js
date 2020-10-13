import React from 'react';
import { connect } from 'react-redux';

import Settings, { mapStateToProps, mapDispatchToProps } from './Settings';

import './style.scss';

class DashboardSettings extends Settings {}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatePropsEqual: next => !next.isActive
  }
)(DashboardSettings);
