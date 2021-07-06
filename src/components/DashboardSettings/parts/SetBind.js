import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/util';
import { PointsLoader, Tooltip } from '../../../components/common';
import { Checkbox, Dropdown } from '../../../components/common/form';
import { Btn } from '../../../components/common/btns';
import DialogManager from '../../../components/common/dialogs/Manager';

import '../style.scss';

const Labels = {
  CONFIG_DEFAULT: 'dashboard-settings.config.default',
  CONFIG_CUSTOM: 'dashboard-settings.config.custom',
  CONFIRM_RESET_TITLE: 'dashboard-settings.confirm-reset.title',
  CONFIRM_RESET_TEXT: 'dashboard-settings.confirm-reset.msg',
  BIND_TITLE: 'dashboard-settings.bind.title',
  BIND_DESC: 'dashboard-settings.bind.desc',
  BIND_ALL: 'dashboard-settings.label.for-all',
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
    isDefaultConfig: PropTypes.bool,
    isLoadingKeys: PropTypes.bool,
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
    DialogManager.showRemoveDialog({
      title: t(Labels.CONFIRM_RESET_TITLE),
      text: t(Labels.CONFIRM_RESET_TEXT),
      onDelete: () => this.props.resetConfig()
    });
  };

  render() {
    const { keys, isAdmin, selectedDashboardKey, isForAllUsers, isDefaultConfig, isLoadingKeys } = this.props;

    return (
      <>
        <h5 className="ecos-dashboard-settings__container-title">{t(Labels.BIND_TITLE)}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">
          {t(Labels.BIND_DESC)} {isDefaultConfig ? t(Labels.CONFIG_DEFAULT) : t(Labels.CONFIG_CUSTOM)}
        </h6>
        <div className="ecos-dashboard-settings__bindings-types">
          <div>
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
            {isLoadingKeys && <PointsLoader className="ecos-dashboard-settings__bindings-types-loader" color={'light-blue'} />}
          </div>
          <Tooltip
            target="ecos-dashboard-settings-bindings-reset"
            text={t(Labels.RESET_DESC)}
            uncontrolled
            autohide
            className="ecos-dashboard-settings__bindings-reset-tooltip"
          >
            <Btn
              id="ecos-dashboard-settings-bindings-reset"
              className="ecos-btn_blue"
              onClick={this.onClickReset}
              disabled={!selectedDashboardKey || isDefaultConfig}
            >
              {t(Labels.RESET_BTN)}
            </Btn>
          </Tooltip>
        </div>
        {isAdmin && (
          <div className="ecos-dashboard-settings__bindings-owner">
            <Checkbox checked={isForAllUsers} onChange={this.onChangeOwner} className="ecos-checkbox_flex">
              {t(Labels.BIND_ALL)}
            </Checkbox>
          </div>
        )}
      </>
    );
  }
}

export default SetBind;
