import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { Checkbox, Dropdown } from '../../components/common/form';
import { IcoBtn } from '../../components/common/btns';

import './style.scss';

class SetBind extends React.Component {
  static propTypes = {
    selectedDashboardKey: PropTypes.string,
    keys: PropTypes.array,
    isAdmin: PropTypes.bool,
    isForAllUsers: PropTypes.bool,
    setData: PropTypes.func
  };

  static defaultProps = {
    selectedDashboardKey: '',
    keys: [],
    setData: () => null
  };

  state = {
    isOpenKeys: false
  };

  getStateOpen = isOpenKeys => {
    this.setState({ isOpenKeys });
  };

  onChangeDashboardKey = field => {
    this.props.setData({ selectedDashboardKey: field.key });
  };

  onChangeOwner = field => {
    this.props.setData({ isForAllUsers: field.checked });
  };

  render() {
    const { keys, isAdmin, selectedDashboardKey, isForAllUsers } = this.props;
    const { isOpenKeys } = this.state;

    return (
      <>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.case-type')}</h5>
        <div className="ecos-dashboard-settings__bindings">
          {keys && !!keys.length && (
            <Dropdown
              source={keys}
              value={selectedDashboardKey}
              valueField={'key'}
              titleField={'displayName'}
              onChange={this.onChangeDashboardKey}
              getStateOpen={this.getStateOpen}
              hideSelected
              className="ecos-dashboard-settings__bindings-dropdown"
              menuClassName="ecos-dashboard-settings__bindings-dropdown__menu"
            >
              <IcoBtn invert icon={isOpenKeys ? 'icon-up' : 'icon-down'} className="ecos-btn_white2 ecos-btn_focus_no ecos-btn_drop-down" />
            </Dropdown>
          )}
          {isAdmin && (
            <div className="ecos-dashboard-settings__bindings-owner">
              <Checkbox checked={isForAllUsers} onChange={this.onChangeOwner} className="ecos-checkbox_flex">
                {t('dashboard-settings.for-all')}
              </Checkbox>
            </div>
          )}
        </div>
      </>
    );
  }
}

export default SetBind;
