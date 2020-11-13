import { connect } from 'react-redux';

import Settings, { mapStateToProps, mapDispatchToProps } from './Settings';

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  {
    areStatePropsEqual: next => !next.isActive
  }
)(Settings);
