import React from 'react';
import { connect } from 'react-redux';
import { NotificationManager } from 'react-notifications';

import { getSettingsConfig, resetStore, setOpenMenuSettings } from '../../actions/menuSettings';
import MenuSettingsService from '../../services/MenuSettingsService';
import { t } from '../../helpers/export/util';
import { Labels } from './utils';

class Controller extends React.Component {
  state = {
    isOpen: false,
    callback: undefined
  };

  onShow = (params = {}, callback) => {
    if (this.state.isOpen) {
      NotificationManager.warning(t(Labels.WARN_EDITOR_OPEN), t('warning'), 5000);
    } else {
      this.setState({ isOpen: true, callback }, () => {
        const id = (params.recordId || this.props.myId || '').split('@').pop();

        this.props.setOpenMenuSettings(true);
        this.props.getSettingsConfig({ ...params, id });
      });
    }
  };

  onHide = () => {
    const { isOpen, callback } = this.state;

    if (isOpen) {
      if (typeof callback === 'function') {
        callback();
      }

      this.setState({ isOpen: false, callback: undefined }, () => {
        this.props.setOpenMenuSettings(false);
        this.props.resetStore();
      });
    }
  };

  componentDidMount() {
    MenuSettingsService.emitter.on(MenuSettingsService.Events.SHOW, this.onShow);
    MenuSettingsService.emitter.on(MenuSettingsService.Events.HIDE, this.onHide);
  }

  componentWillUnmount() {
    MenuSettingsService.emitter.off(MenuSettingsService.Events.SHOW, this.onShow);
    MenuSettingsService.emitter.off(MenuSettingsService.Events.HIDE, this.onHide);
  }

  render() {
    return null;
  }
}

const mapStateToProps = state => ({
  myId: state.menu.id
});

const mapDispatchToProps = dispatch => ({
  setOpenMenuSettings: payload => dispatch(setOpenMenuSettings(payload)),
  getSettingsConfig: payload => dispatch(getSettingsConfig(payload)),
  resetStore: payload => dispatch(resetStore(payload))
});

const MSController = connect(
  mapStateToProps,
  mapDispatchToProps
)(Controller);

export default MSController;
