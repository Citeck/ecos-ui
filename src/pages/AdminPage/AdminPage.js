import React from 'react';
import { connect } from 'react-redux';
import isNil from 'lodash/isNil';

import { initAdminSection, updActiveSection } from '../../actions/adminSection';
import { getSearchParams, t } from '../../helpers/util';
import { Loader } from '../../components/common';
import { Well } from '../../components/common/form';
import AdminSection from '../../components/AdminSection';
import { SectionTypes } from '../../constants/adminSection';

import './style.scss';

const mapStateToProps = state => ({
  urlParams: getSearchParams(),
  isAccessible: state.adminSection.isAccessible,
  isInitiated: state.adminSection.isInitiated
});

const mapDispatchToProps = dispatch => ({
  initAdminSection: () => dispatch(initAdminSection()),
  updateActiveSection: () => dispatch(updActiveSection())
});

class AdminPage extends React.Component {
  componentDidMount() {
    if (!this.props.isInitiated) {
      this.props.initAdminSection();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.tabLink !== this.props.tabLink) {
      this.props.updateActiveSection();
    }
  }

  get isAccessibleSectionType() {
    const {
      urlParams: { type }
    } = this.props;

    return type === SectionTypes.BPM || type === SectionTypes.DMN;
  }

  render() {
    const { isAccessible } = this.props;

    if (isNil(isAccessible)) {
      return <Loader height={100} width={100} />;
    }

    if (!isAccessible && !this.isAccessibleSectionType) {
      return <Well className="admin-page__access-denied">{t('admin-section.error.access-denied')}</Well>;
    }

    return <AdminSection {...this.props} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminPage);
