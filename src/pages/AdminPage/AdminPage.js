import React from 'react';
import { connect } from 'react-redux';

import { initAdminSection } from '../../actions/adminSection';
import { isExistValue, t } from '../../helpers/util';
import { Loader } from '../../components/common';
import { Well } from '../../components/common/form';
import AdminSection from '../../components/AdminSection';

import './style.scss';

const mapStateToProps = state => ({
  isAccessible: state.adminSection.isAccessible
});

const mapDispatchToProps = dispatch => ({
  initAdminSection: () => dispatch(initAdminSection())
});

class AdminPage extends React.Component {
  componentDidMount() {
    this.props.initAdminSection();
  }

  render() {
    const { isAccessible } = this.props;

    if (!isExistValue(isAccessible)) {
      return <Loader height={100} width={100} />;
    }

    if (!isAccessible) {
      return <Well className="admin-page__access-denied">{t('admin-section.error.access-denied')}</Well>;
    }

    return <AdminSection {...this.props} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminPage);
