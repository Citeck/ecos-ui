import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { EcosModal } from '../../common';
import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import { closest, t } from '../../../helpers/util';

import './JournalsSettingsFooter.scss';

class JournalsSettingsFooter extends Component {
  constructor(props) {
    super(props);

    this.state = { dialogOpen: false };
    this.settingName = '';
  }

  componentDidMount() {
    this.createKeydownEvents();
  }

  componentWillUnmount() {
    this.removeKeydownEvents();
  }

  createKeydownEvents() {
    document.addEventListener('keydown', this.onKeydown);
  }

  removeKeydownEvents() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown = e => {
    if (e.key === 'Enter') {
      const inputRef = this.settingTitleInputRef || {};

      if (e.target === inputRef.current) {
        this.createSetting();
      } else if (closest(e.target, this.props.parentClass)) {
        this.applySetting();
      }
    }
  };

  createSetting = () => {
    const { onCreate } = this.props;

    if (typeof onCreate === 'function' && this.settingName) {
      onCreate(this.settingName);
      this.closeDialog();
    }
  };

  saveSetting = () => {
    const { onSave } = this.props;

    if (typeof onSave === 'function') {
      onSave();
    }
  };

  applySetting = () => {
    const { onApply } = this.props;

    if (typeof onApply === 'function') {
      onApply();
    }
  };

  resetSettings = () => {
    const { onReset } = this.props;

    if (typeof onReset === 'function') {
      onReset();
    }
  };

  getSetting = title => {
    const { journalSetting, grouping, columnsSetup, predicate } = this.props;

    return {
      ...journalSetting,
      sortBy: columnsSetup.sortBy,
      groupBy: grouping.groupBy,
      columns: grouping.groupBy.length ? grouping.columns : columnsSetup.columns,
      predicate: predicate,
      title: title || journalSetting.title
    };
  };

  closeDialog = () => {
    this.setState({ dialogOpen: false });
    this.clearSettingName();
  };

  openDialog = () => {
    this.setState({ dialogOpen: true });
  };

  clearSettingName = () => {
    this.settingName = '';
  };

  onChangeSettingName = e => {
    this.settingName = e.target.value;
  };

  onDialogCalculateBounds = () => {
    const ref = this.settingTitleInputRef;
    if (ref && ref.current) {
      ref.current.focus();
    }
  };

  getSettingTitleInputRef = ref => {
    this.settingTitleInputRef = ref;
  };

  render() {
    const { canSave, noCreateBtn } = this.props;

    return (
      <>
        <Columns
          className="ecos-journal__settings-footer"
          cols={[
            <>
              {!noCreateBtn && (
                <Btn className="ecos-btn_x-step_10" onClick={this.openDialog}>
                  {t('journals.action.create-template')}
                </Btn>
              )}
              {canSave && <Btn onClick={this.saveSetting}>{t('journals.action.apply-template')}</Btn>}
            </>,

            <>
              <Btn className="ecos-btn_x-step_10 ecos-journal__settings-footer-action_reset" onClick={this.resetSettings}>
                {t('journals.action.reset')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.applySetting}>
                {t('journals.action.apply')}
              </Btn>
            </>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />

        <EcosModal
          title={t('journals.action.dialog-msg')}
          isOpen={this.state.dialogOpen}
          hideModal={this.closeDialog}
          className={'journal__dialog ecos-modal_width-sm'}
          onCalculateBounds={this.onDialogCalculateBounds}
        >
          <div className={'journal__dialog-panel'}>
            <Input type="text" onChange={this.onChangeSettingName} getInputRef={this.getSettingTitleInputRef} />
          </div>

          <div className="journal__dialog-buttons">
            <Btn onClick={this.closeDialog}>{t('journals.action.cancel')}</Btn>
            <Btn onClick={this.createSetting} className={'ecos-btn_blue'}>
              {t('journals.action.save')}
            </Btn>
          </div>
        </EcosModal>
      </>
    );
  }
}

JournalsSettingsFooter.propTypes = {
  parentClass: PropTypes.string,
  canSave: PropTypes.bool,

  onApply: PropTypes.func,
  onCreate: PropTypes.func,
  onReset: PropTypes.func,
  onSave: PropTypes.func
};

export default JournalsSettingsFooter;
