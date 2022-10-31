import React from 'react';
import { connect } from 'react-redux';

import Structure from './components/Structure';
import Widgets from './components/Widgets';
import { setOrgstructureConfig, setSelectedPerson } from '../../actions/orgstructure';
import { getSearchParams } from '../../helpers/urls';
import Dashboard from '../Dashboard';

import './style.scss';
import { ORGSTRUCTURE_CONFIG, ATTRIBUTES } from './config';
import { setDashboardConfig, setDashboardIdentification } from '../../actions/dashboard';

class Orgstructure extends React.Component {
  componentDidMount() {
    const { onSelectPerson, setDashboardConfig, setDashboardIdentification } = this.props;
    const { recordRef } = getSearchParams() || {};

    const key = this.props.tabId;

    const payload = {
      key,
      originalConfig: ORGSTRUCTURE_CONFIG.config,
      config: ORGSTRUCTURE_CONFIG.config.layouts,
      modelAttributes: ATTRIBUTES
    };
    const identification = { id: 'orgstructure', key: 'emodel/type@person', type: 'profile-details' };
    console.log('here');
    setDashboardIdentification({ key, identification });
    setDashboardConfig(payload);

    if (recordRef) {
      onSelectPerson(recordRef);
    }
  }

  render() {
    const { tabId } = this.props;
    console.log('tabId = ', tabId);
    return (
      <div className="orgstructure-page__grid__container">
        <div className="orgstructure-page__grid__main">
          <Structure />
        </div>
        <Dashboard tabId={tabId} />
        {/* <Widgets /> */}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  onSelectPerson: recordRef => dispatch(setSelectedPerson(recordRef)),
  setOrgstructureConfig: config => dispatch(setOrgstructureConfig(config)),
  setDashboardIdentification: payload => dispatch(setDashboardIdentification(payload)),
  setDashboardConfig: payload => dispatch(setDashboardConfig(payload))
});

export default connect(
  null,
  mapDispatchToProps
)(Orgstructure);
