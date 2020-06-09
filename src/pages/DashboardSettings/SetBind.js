import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { Checkbox, Dropdown } from '../../components/common/form';
import { Btn } from '../../components/common/btns';
import DialogManager from '../../components/common/dialogs/Manager';
import { DASHBOARD_DEFAULT_KEY } from '../../constants';

import './style.scss';

class SetBind extends React.Component {
  static propTypes = {
    selectedDashboardKey: PropTypes.string,
    keys: PropTypes.array,
    isAdmin: PropTypes.bool,
    isForAllUsers: PropTypes.bool,
    setData: PropTypes.func,
    resetConfig: PropTypes.func
  };

  static defaultProps = {
    selectedDashboardKey: '',
    keys: [],
    setData: () => null
  };

  onChangeDashboardKey = field => {
    this.props.setData({ selectedDashboardKey: field.key });
  };

  onChangeOwner = field => {
    this.props.setData({ isForAllUsers: field.checked });
  };

  onClickReset = () => {
    DialogManager.confirmDialog({
      title: t('dashboard-settings.confirm-delete'),
      onYes: () => this.props.resetConfig()
    });
  };

  render() {
    const { keys, isAdmin, selectedDashboardKey, isForAllUsers } = this.props;

    return (
      <>
        <div className="ecos-dashboard-settings__container-title">{t('dashboard-settings.bind.title')}</div>
        {isAdmin && (
          <div className="ecos-dashboard-settings__bindings-owner">
            <Checkbox checked={isForAllUsers} onChange={this.onChangeOwner} className="ecos-checkbox_flex">
              {t('dashboard-settings.for-all')}
            </Checkbox>
          </div>
        )}
        <div className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.case-type')}</div>
        <div className="ecos-dashboard-settings__bindings-types">
          <Dropdown
            source={keys}
            value={selectedDashboardKey}
            valueField={'key'}
            titleField={'displayName'}
            onChange={this.onChangeDashboardKey}
            hideSelected
            className="ecos-dashboard-settings__bindings-dropdown"
            menuClassName="ecos-dashboard-settings__bindings-dropdown-menu"
            controlClassName="ecos-btn_drop-down ecos-btn_white2"
          />
          <Btn
            className="ecos-btn_blue"
            onClick={this.onClickReset}
            disabled={!selectedDashboardKey || selectedDashboardKey === DASHBOARD_DEFAULT_KEY}
          >
            {t('dashboard-settings.bind.reset.btn')}
          </Btn>
          <div className="ecos-dashboard-settings__bindings-description">{t('dashboard-settings.bind.reset.desc')}</div>
        </div>
      </>
    );
  }
}

export default SetBind;
