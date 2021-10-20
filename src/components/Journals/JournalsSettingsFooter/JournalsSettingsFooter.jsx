import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';

import { EcosModal } from '../../common';
import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import { t } from '../../../helpers/util';

import './JournalsSettingsFooter.scss';

const Labels = {
  Template: {
    CREATE: 'journals.action.create-template',
    APPLY: 'journals.action.apply-template',
    DW_TITLE: 'journals.action.dialog-msg',
    DW_CANCEL: 'journals.action.cancel',
    DW_SAVE: 'journals.action.save'
  },

  RESET: 'journals.action.reset',
  APPLY: 'journals.action.apply'
};

class JournalsSettingsFooter extends Component {
  constructor(props) {
    super(props);

    this.state = { dialogOpen: false, disabledApply: false };
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
      const target = e.target;

      if (target === inputRef.current) {
        this.createSetting();
      } else if (target && target.closest(`.${this.props.parentClass}`)) {
        debounce(this.applySetting, 360)();
      }
    }
  };

  createSetting = () => {
    const { onCreate } = this.props;

    if (isFunction(onCreate) && this.settingName) {
      onCreate(this.settingName);
      this.closeDialog();
    }
  };

  saveSetting = () => {
    const { onSave } = this.props;
    isFunction(onSave) && onSave();
  };

  applySetting = () => {
    if (this.state.disabledApply) {
      return;
    }

    this.setState({ disabledApply: true }, () => {
      const { onApply } = this.props;
      isFunction(onApply) && onApply();
    });
  };

  resetSettings = () => {
    const { onReset } = this.props;
    isFunction(onReset) && onReset();
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
    const { disabledApply } = this.state;

    return (
      <>
        <Columns
          className="ecos-journal__settings-footer"
          cols={[
            <>
              {!noCreateBtn && (
                <Btn className="ecos-btn_x-step_10" onClick={this.openDialog}>
                  {t(Labels.Template.CREATE)}
                </Btn>
              )}
              {canSave && <Btn onClick={this.saveSetting}>{t(Labels.Template.APPLY)}</Btn>}
            </>,
            <>
              <Btn className="ecos-btn_x-step_10 ecos-journal__settings-footer-action_reset" onClick={this.resetSettings}>
                {t(Labels.RESET)}
              </Btn>
              <Btn
                className="ecos-btn_blue ecos-btn_hover_light-blue"
                onClick={this.applySetting}
                disabled={disabledApply}
                loading={disabledApply}
              >
                {t(Labels.APPLY)}
              </Btn>
            </>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />

        <EcosModal
          title={t(Labels.Template.DW_TITLE)}
          isOpen={this.state.dialogOpen}
          hideModal={this.closeDialog}
          className="journal__dialog ecos-modal_width-sm"
          onCalculateBounds={this.onDialogCalculateBounds}
        >
          <div className="journal__dialog-panel">
            <Input type="text" onChange={this.onChangeSettingName} getInputRef={this.getSettingTitleInputRef} />
          </div>

          <div className="journal__dialog-buttons">
            <Btn onClick={this.closeDialog}>{t(Labels.Template.DW_CANCEL)}</Btn>
            <Btn onClick={this.createSetting} className="ecos-btn_blue">
              {t(Labels.Template.DW_SAVE)}
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
