import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import Structure from './components/Structure';
import { getDashboardConfig, setOrgstructureConfig, setSelectedPerson } from '../../actions/orgstructure';
import { getSearchParams } from '../../helpers/urls';
import { setDashboardConfig, setDashboardIdentification } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import classNames from 'classnames';
import PageTabList from '../../services/pageTabs/PageTabList';

import './style.scss';

// todo: после изменения recordRef, виджеты подгружают данные и не всегда их позиции и
//  размеры корректно подсчитываются. Необходимо обновлять весь Layout для того, чтобы всё спозиционировалось
//  корректно

class Orgstructure extends React.Component {
  constructor(props) {
    super(props);

    this.props.getDashboardConfig();
  }

  componentDidMount() {
    const { onSelectPerson } = this.props;
    const { recordRef } = getSearchParams() || {};

    if (recordRef) {
      onSelectPerson(recordRef);
    }
  }

  renderDashboard() {
    const { recordRef, config } = this.props;

    if (!recordRef || !config) {
      return null;
    }

    const { menuType, isMobile, tabId, identificationId } = this.props;
    const { columns, type } = get(config, '0') || {};

    return (
      <div>
        <Layout
          className={classNames({ 'ecos-layout_mobile': isMobile })}
          menuType={menuType}
          isMobile={isMobile}
          columns={columns}
          type={type}
          tabId={tabId}
          recordRef={recordRef}
          dashboardId={identificationId}
          isActiveLayout={PageTabList.isActiveTab(tabId)}
          // todo: обработчики ниже реализовать по аналогии с Dashboard
          // onSaveWidget={this.prepareWidgetsConfig}
          // onSaveWidgetProps={this.handleSaveWidgetProps}
        />
        ;
      </div>
    );
  }

  render() {
    return (
      <div className="orgstructure-page__grid__container">
        <div className="orgstructure-page__grid__main">
          <Structure />
        </div>

        {this.renderDashboard()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    recordRef: get(state, 'orgstructure.id'),
    config: get(state, ['dashboard', ownProps.tabId, 'config'])
  };
};

const mapDispatchToProps = (dispatch, state) => ({
  getDashboardConfig: () => dispatch(getDashboardConfig({ key: state.tabId })),
  onSelectPerson: recordRef => dispatch(setSelectedPerson(recordRef)),
  setOrgstructureConfig: config => dispatch(setOrgstructureConfig(config)),
  setDashboardIdentification: payload => dispatch(setDashboardIdentification(payload)),
  setDashboardConfig: payload => dispatch(setDashboardConfig(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Orgstructure);
