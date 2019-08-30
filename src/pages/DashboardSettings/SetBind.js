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
    isAdmin: false,
    isForAllUsers: false,
    setData: () => {}
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

  onChangeKeyForAllUser = field => {
    this.props.setData({ isForAllUsers: field.checked });
  };

  render() {
    const { keys, isAdmin, selectedDashboardKey, isForAllUsers } = this.props;
    const { isOpenKeys } = this.state;

    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.case-type')}</h5>
        <div className="ecos-dashboard-settings__keys-wrapper">
          <Dropdown
            source={keys}
            value={selectedDashboardKey}
            valueField={'key'}
            titleField={'displayName'}
            onChange={this.onChangeDashboardKey}
            getStateOpen={this.getStateOpen}
            hideSelected
            className={'ecos-dashboard-settings__keys-dropdown'}
          >
            <IcoBtn invert icon={isOpenKeys ? 'icon-up' : 'icon-down'} className={`ecos-btn_white2 ecos-btn_focus_no ecos-btn_drop-down`} />
          </Dropdown>
          {isAdmin && (
            <Checkbox checked={isForAllUsers} onChange={this.onChangeKeyForAllUser} className={'ecos-dashboard-settings__keys-checkbox'}>
              {t('dashboard-settings.for-all')}
            </Checkbox>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default SetBind;
