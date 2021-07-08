import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { Container } from 'reactstrap';

import { getDashboardConfig, resetAllDashboardsConfig } from '../../actions/dashboard';
import { RequestStatuses } from '../../constants';
import { DashboardTypes } from '../../constants/dashboard';
import { t } from '../../helpers/export/util';
import DashboardService from '../../services/dashboard';
import PageTabList from '../../services/pageTabs/PageTabList';
import { clearCache } from '../ReactRouterCache';
import Settings, { getStateId, mapDispatchToProps, mapStateToProps } from './Settings';

class DashboardSettingsModal extends Settings {
  static propTypes = {
    ...super.propTypes,
    modalRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    dashboardId: PropTypes.string,
    recordRef: PropTypes.string,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    onSetDialogProps: PropTypes.func,
    updateDashboard: PropTypes.bool
  };

  static defaultProps = {
    ...super.defaultProps,
    mode: 'modal'
  };

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    const { onSetDialogProps, identification } = this.props;
    const type = get(identification, 'type');

    if (type !== get(prevProps, 'identification.type') && typeof onSetDialogProps === 'function') {
      onSetDialogProps({ title: this.getTitleByType(type) });
    }
  }

  getTitleByType = type => {
    let title = '';

    switch (type) {
      case DashboardTypes.USER:
        title = t('dashboard-settings.page-title');
        break;
      case DashboardTypes.CASE_DETAILS:
        title = t('dashboard-settings.card-settings');
        break;
      default:
        title = t('dashboard-settings.page-display-settings');
        break;
    }

    return title;
  };

  fetchData(props = this.props) {
    const { initSettings } = props;
    let { recordRef, dashboardId } = props;

    if (isEmpty(recordRef)) {
      recordRef = get(this.getPathInfo(), 'recordRef');
    }

    if (isEmpty(dashboardId)) {
      dashboardId = get(this.getPathInfo(), 'dashboardId');
    }

    if (!dashboardId && !recordRef) {
      return;
    }

    initSettings({ recordRef, dashboardId });
  }

  checkRequestResult(prevProps) {
    const oldRStatus = get(prevProps, 'requestResult.status', null);
    const oldSaveWay = get(prevProps, 'requestResult.saveWay', null);
    const checkResult = get(this.props, 'requestResult', {});
    const newRStatus = checkResult.status;
    const newSaveWay = checkResult.saveWay;

    if (newRStatus && oldRStatus !== newRStatus) {
      const { getAwayFromPage, updateDashboard, getDashboardConfig, resetAllDashboardsConfig, onSave, identification } = this.props;
      let { recordRef } = this.props;

      clearCache();
      this.clearLocalStorage();

      switch (newRStatus) {
        case RequestStatuses.SUCCESS: {
          if (isEmpty(recordRef)) {
            recordRef = get(this.getPathInfo(), 'recordRef');
          }

          getAwayFromPage();
          updateDashboard ? getDashboardConfig({ recordRef }) : resetAllDashboardsConfig(identification);
          typeof onSave === 'function' && onSave();

          return;
        }
        case RequestStatuses.RESET: {
          getDashboardConfig({ recordRef });
          return;
        }
        default:
          return;
      }
    }

    if (newSaveWay && oldSaveWay !== newSaveWay && newSaveWay !== DashboardService.SaveWays.CONFIRM) {
      this.acceptChanges(checkResult.dashboardId);
    }
  }

  getPositionOffset = () => {
    const defaultOffset = { left: 0, top: 0 };
    const modal = get(this, 'props.modalRef.current._dialog');

    if (!modal) {
      return defaultOffset;
    }

    const content = modal.querySelector('.modal-content');

    if (!content) {
      return defaultOffset;
    }

    const positions = content.getBoundingClientRect();

    return {
      left: -positions.left,
      top: -positions.top
    };
  };

  handleCloseSettings = () => {
    const { onClose } = this.props;

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  render() {
    return (
      <Container className="ecos-dashboard-settings ecos-dashboard-settings_modal">
        {this.renderLoader()}
        <div className="ecos-dashboard-settings__body">
          {this.renderSpecificationsBlock()}
          {this.renderOwnershipBlock()}
          <div className="ecos-dashboard-settings__section">
            {this.renderDeviceTabsBlock()}
            {this.renderLayoutTabsBlock()}
            {this.renderLayoutsBlock()}
            {this.renderWidgetsBlock()}
          </div>
        </div>
        {this.renderButtons()}
        {this.renderDialogs()}
      </Container>
    );
  }
}

const _mapDispatchToProps = (dispatch, ownProps) => {
  const key = PageTabList.activeTab.id;

  return {
    ...mapDispatchToProps(dispatch, ownProps),
    getDashboardConfig: payload => dispatch(getDashboardConfig({ ...payload, key })),
    resetAllDashboardsConfig: payload => dispatch(resetAllDashboardsConfig({ ...payload }))
  };
};

export default connect(
  mapStateToProps,
  _mapDispatchToProps
)(DashboardSettingsModal);
