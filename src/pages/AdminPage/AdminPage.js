import React from 'react';
import { connect } from 'react-redux';

import { initAdminSection } from '../../actions/adminSection';
import AdminSection from '../../components/AdminSection';

const mapDispatchToProps = dispatch => ({
  initAdminSection: () => dispatch(initAdminSection())
});

class AdminPage extends React.Component {
  componentDidMount() {
    this.props.initAdminSection();
  }

  render() {
    return <AdminSection {...this.props} />;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(AdminPage);
