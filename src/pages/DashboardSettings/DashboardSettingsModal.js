// eslint-disable-next-line no-unused-vars
import React from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';

import Settings, { getStateId, mapStateToProps, mapDispatchToProps } from './Settings';
import { DashboardTypes } from '../../constants/dashboard';
import { t } from '../../helpers/export/util';
import DashboardService from '../../services/dashboard';
import { Container } from 'reactstrap';
import { RequestStatuses } from '../../constants';
import { clearCache } from '../../components/ReactRouterCache';
import { getDashboardConfig } from '../../actions/dashboard';

class DashboardSettingsModal extends Settings {
  _actionsRef = null;
  _bodyRef = null;

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    const type = get(this, 'props.identification.type');

    if (type !== get(prevProps, 'identification.type')) {
      this.props.onSetDialogProps({ title: this.getTitleByType(type) });
    }
  }

  get bodyStyles() {
    const modal = get(this, 'props.modalRef.current._dialog');
    const footerHeight = get(this._actionsRef, 'offsetHeight', 0);
    const height = [];

    if (modal) {
      const header = modal.querySelector('.ecos-modal-header');

      if (header) {
        height.push(`${header.offsetHeight}px`);
      }
    }

    if (footerHeight) {
      height.push(`${footerHeight}px`);
    }

    if (this._bodyRef) {
      const styles = window.getComputedStyle(this._bodyRef);

      if (styles.marginTop) {
        height.push(styles.marginTop);
      }

      if (styles.paddingTop) {
        height.push(styles.paddingTop);
      }

      if (styles.paddingBottom) {
        height.push(styles.paddingBottom);
      }

      if (styles.marginBottom) {
        height.push(styles.marginBottom);
      }
    }

    return {
      maxHeight: `calc(100vh - (${height.join(' + ') || 0}))`
    };
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

  setBodyRef = ref => {
    if (ref) {
      this._bodyRef = ref;
    }
  };

  setActionRef = ref => {
    if (ref) {
      this._actionsRef = ref;
    }
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
    const newRStatus = get(this.props, 'requestResult.status', null);
    const oldSaveWay = get(prevProps, 'requestResult.saveWay', null);
    const checkResult = get(this.props, 'requestResult', {});
    const newSaveWay = checkResult.saveWay;

    if (newRStatus && oldRStatus !== newRStatus && newRStatus === RequestStatuses.SUCCESS) {
      const onSave = get(this, 'props.onSave');
      let { recordRef } = this.props;

      if (isEmpty(recordRef)) {
        recordRef = get(this.getPathInfo(), 'recordRef');
      }

      clearCache();
      this.clearLocalStorage();
      this.props.getAwayFromPage();
      this.props.getDashboardConfig({ recordRef });

      if (typeof onSave === 'function') {
        onSave();
      }
    } else if (newSaveWay && oldSaveWay !== newSaveWay && newSaveWay !== DashboardService.SaveWays.CONFIRM) {
      this.acceptChanges(checkResult.dashboardId);
    }
  }

  render() {
    return (
      <Container className="ecos-dashboard-settings ecos-dashboard-settings_modal">
        {this.renderLoader()}
        <div className="ecos-dashboard-settings__body" style={this.bodyStyles} ref={this.setBodyRef}>
          {this.renderOwnershipBlock()}
          {this.renderDeviceTabsBlock()}
          {this.renderLayoutTabsBlock()}
          <div className="ecos-dashboard-settings__container">
            {this.renderLayoutsBlock()}
            {this.renderWidgetsBlock()}
          </div>
        </div>
        <div ref={this.setActionRef}>{this.renderButtons()}</div>
        {this.renderDialogs()}
      </Container>
    );
  }
}

const _mapDispatchToProps = (dispatch, ownProps) => {
  const key = getStateId(ownProps);

  return {
    ...mapDispatchToProps(dispatch, ownProps),
    getDashboardConfig: payload => dispatch(getDashboardConfig({ ...payload, key }))
  };
};

export default connect(
  mapStateToProps,
  _mapDispatchToProps
)(DashboardSettingsModal);
