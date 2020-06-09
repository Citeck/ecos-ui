import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { Checkbox, Dropdown } from '../../components/common/form';
import { Btn } from '../../components/common/btns';
import DialogManager from '../../components/common/dialogs/Manager';

import './style.scss';

const Labels = {
  CONFIRM_RESET_TITLE: 'dashboard-settings.confirm-reset.title',
  CONFIRM_RESET_TEXT: 'dashboard-settings.confirm-reset.msg',
  BIND_TITLE: 'dashboard-settings.bind.title',
  BIND_ALL: 'dashboard-settings.for-all',
  CASE_TYPE: 'dashboard-settings.case-type',
  RESET_DESC: 'dashboard-settings.bind.reset.desc',
  RESET_BTN: 'dashboard-settings.bind.reset.btn'
};

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
      title: t(Labels.CONFIRM_RESET_TITLE),
      text: t(Labels.CONFIRM_RESET_TEXT),
      onYes: () => this.props.resetConfig()
    });
  };

  render() {
    const { keys, isAdmin, selectedDashboardKey, isForAllUsers } = this.props;

    return (
      <>
        <div className="ecos-dashboard-settings__container-title">{t(Labels.BIND_TITLE)}</div>
        {isAdmin && (
          <div className="ecos-dashboard-settings__bindings-owner">
            <Checkbox checked={isForAllUsers} onChange={this.onChangeOwner} className="ecos-checkbox_flex">
              {t(Labels.BIND_ALL)}
            </Checkbox>
          </div>
        )}
        <div className="ecos-dashboard-settings__container-subtitle">{t(Labels.CASE_TYPE)}</div>
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
          <Btn className="ecos-btn_blue" onClick={this.onClickReset} disabled={!selectedDashboardKey}>
            {t(Labels.RESET_BTN)}
          </Btn>
          <div className="ecos-dashboard-settings__bindings-description">{t(Labels.RESET_DESC)}</div>
        </div>
      </>
    );
  }
}

export default SetBind;
