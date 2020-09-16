import React from 'react';
import { connect } from 'react-redux';

import { setOpenMenuSettings } from '../../actions/menuSettings';
import MenuSettingsService from '../../services/MenuSettingsService';

class Controller extends React.Component {
  state = {
    isOpen: false
  };

  onShow = () => {
    !this.state.isOpen && this.props.setOpenMenuSettings(true);
  };

  onHide = () => {
    this.state.isOpen && this.props.setOpenMenuSettings(false);
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

const mapDispatchToProps = dispatch => ({
  setOpenMenuSettings: payload => dispatch(setOpenMenuSettings(payload))
});

const MSController = connect(
  null,
  mapDispatchToProps
)(Controller);

export default MSController;
