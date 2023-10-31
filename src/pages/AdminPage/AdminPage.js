import React from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
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
    const { urlParams } = this.props;
    const { type } = urlParams;

    return isEmpty(urlParams) || type === SectionTypes.BPM || type === SectionTypes.DMN || type === SectionTypes.BPMN_ADMIN;
  }

  render() {
    const { isAccessible } = this.props;

    if (isNil(isAccessible)) {
      return <Loader height={100} width={100} />;
    }

    return (
      <>
        {!isAccessible && !this.isAccessibleSectionType && (
          <Well className="admin-page__access-denied">{t('admin-section.error.access-denied')}</Well>
        )}
        <AdminSection {...this.props} isAccessibleSectionType={this.isAccessibleSectionType} />
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminPage);
