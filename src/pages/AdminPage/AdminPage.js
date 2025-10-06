import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import React from 'react';
import { connect } from 'react-redux';

import { initAdminSection, updActiveSection } from '../../actions/adminSection';
import AdminSection from '../../components/AdminSection';
import { Loader } from '../../components/common';
import { Well } from '../../components/common/form';
import { SectionTypes } from '../../constants/adminSection';
import { getStateId } from '../../helpers/store';
import { getEnabledWorkspaces, getId, getSearchParams, t } from '../../helpers/util';

import './style.scss';

const getKeys = ({ id, tabId, stateId }) => stateId || getStateId({ tabId, id: id || getId() });

const mapStateToProps = state => ({
  urlParams: getSearchParams(),
  isAccessible: state.adminSection.isAccessible,
  wsSections: state.adminSection.wsSections,
  isInitiated: state.adminSection.isInitiated
});

const mapDispatchToProps = dispatch => {
  return {
    initAdminSection: stateId => dispatch(initAdminSection(stateId)),
    updateActiveSection: stateId => dispatch(updActiveSection(stateId))
  };
};

class AdminPage extends React.Component {
  constructor(props) {
    super(props);

    const enabledWorkspaces = getEnabledWorkspaces();
    this.stateId = enabledWorkspaces ? getKeys(props) : null;

    this.state = {
      isAccessible: !enabledWorkspaces ? props.isAccessible : props.wsSections[this.stateId]?.isAccessible || false
    };
  }

  componentDidMount() {
    const enabledWorkspaces = getEnabledWorkspaces();

    if (enabledWorkspaces) {
      this.props.initAdminSection(this.stateId);
    }

    if (!this.props.isInitiated && !enabledWorkspaces) {
      this.props.initAdminSection();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { wsSections, isAccessible } = this.props;

    if (!getEnabledWorkspaces() && prevProps.isAccessible !== isAccessible) {
      this.setState({ isAccessible });
    }

    if (prevProps.tabLink !== this.props.tabLink) {
      this.props.updateActiveSection(this.stateId);
    }

    if (
      getEnabledWorkspaces() &&
      this.stateId &&
      !isNil(wsSections[this.stateId]?.isAccessible) &&
      this.state.isAccessible !== wsSections[this.stateId].isAccessible
    ) {
      this.setState({ isAccessible: wsSections[this.stateId].isAccessible });
    }
  }

  get isAccessibleSectionType() {
    const { urlParams } = this.props;
    const { type } = urlParams;

    return isEmpty(urlParams) || type === SectionTypes.BPM || type === SectionTypes.DMN || type === SectionTypes.BPMN_ADMIN;
  }

  render() {
    const { isAccessible } = this.state;

    if (isNil(isAccessible)) {
      return <Loader height={100} width={100} />;
    }

    return (
      <>
        {!isAccessible && !this.isAccessibleSectionType && (
          <Well className="admin-page__access-denied">{t('admin-section.error.access-denied')}</Well>
        )}
        <AdminSection
          {...this.props}
          isAccessible={isAccessible}
          isAccessibleSectionType={this.isAccessibleSectionType}
          stateId={this.stateId}
        />
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminPage);
