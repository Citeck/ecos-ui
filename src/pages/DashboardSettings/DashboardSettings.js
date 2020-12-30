import { connect } from 'react-redux';

import Settings, { mapDispatchToProps, mapStateToProps } from '../../components/DashboardSettings/Settings';

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatePropsEqual: next => !next.isActive
  }
)(Settings);
