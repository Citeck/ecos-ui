import React, { Component } from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';
import get from 'lodash/get';

import { EcosModal } from '../../common';
import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import {
  createJournalSetting,
  reloadGrid,
  resetJournalSettingData,
  saveJournalSetting,
  setJournalSetting
} from '../../../actions/journals';
import { closest, deepClone, t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { DEFAULT_JOURNALS_PAGINATION, JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsSettingsFooter.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    predicate: newState.predicate,
    columnsSetup: newState.columnsSetup,
    grouping: newState.grouping,
    journalSetting: newState.journalSetting,
    maxItems: get(newState, 'grid.pagination.maxItems', DEFAULT_JOURNALS_PAGINATION.maxItems)
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setJournalSetting: setting => dispatch(setJournalSetting(w(setting))),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    createJournalSetting: (journalId, settings) => dispatch(createJournalSetting(w({ journalId, settings }))),
    resetJournalSettingData: journalSettingId => dispatch(resetJournalSettingData(w(journalSettingId)))
  };
};

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
    if (this.settingName) {
      this.props.createJournalSetting(this.props.journalId, this.getSetting(this.settingName));
      this.closeDialog();
      trigger.call(this, 'onCreate');
    }
  };

  saveSetting = () => {
    const journalSetting = this.getSetting();
    this.props.saveJournalSetting(journalSetting[[JOURNAL_SETTING_ID_FIELD]], this.getSetting());
    trigger.call(this, 'onSave');
  };

  applySetting = () => {
    const { setJournalSetting, reloadGrid, maxItems } = this.props;
    const journalSetting = this.getSetting();
    const { columns, groupBy, sortBy, predicate } = journalSetting;
    const predicates = predicate ? [predicate] : [];
    const pagination = { ...DEFAULT_JOURNALS_PAGINATION, maxItems };

    setJournalSetting(journalSetting);
    reloadGrid({ columns, groupBy, sortBy, predicates, pagination });
    trigger.call(this, 'onApply');
  };

  resetSettings = () => {
    const { resetJournalSettingData, journalSetting } = this.props;

    resetJournalSettingData(journalSetting[JOURNAL_SETTING_ID_FIELD] || '');
    trigger.call(this, 'onReset', deepClone(journalSetting));
  };

  getSetting = title => {
    let { journalSetting, grouping, columnsSetup, predicate } = this.props;

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
    const { journalSetting } = this.props;

    return (
      <>
        <Columns
          className={'ecos-journal__settings-footer'}
          cols={[
            <>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.openDialog}>
                {t('journals.action.create-template')}
              </Btn>
              {journalSetting[JOURNAL_SETTING_ID_FIELD] && <Btn onClick={this.saveSetting}>{t('journals.action.apply-template')}</Btn>}
            </>,

            <>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.resetSettings}>
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
  stateId: PropTypes.string,
  journalId: PropTypes.string,

  onApply: PropTypes.func,
  onCreate: PropTypes.func,
  onReset: PropTypes.func,
  onSave: PropTypes.func
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsSettingsFooter);
