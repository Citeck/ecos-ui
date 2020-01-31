import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { withRouter } from 'react-router';
import { push } from 'connected-react-router';
import queryString from 'query-string';

import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import { EcosModal } from '../../../../src/components/common';
import {
  cancelJournalSettingData,
  createJournalSetting,
  reloadGrid,
  saveJournalSetting,
  setJournalSetting
} from '../../../actions/journals';
import { closest, t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsSettingsFooter.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    predicate: newState.predicate,
    columnsSetup: newState.columnsSetup,
    grouping: newState.grouping,
    journalSetting: newState.journalSetting
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    push: url => dispatch(push(url)),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setJournalSetting: setting => dispatch(setJournalSetting(w(setting))),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    createJournalSetting: (journalId, settings) => dispatch(createJournalSetting(w({ journalId, settings }))),
    cancelJournalSettingData: journalSettingId => dispatch(cancelJournalSettingData(w(journalSettingId)))
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
    let journalSetting = this.getSetting();
    const { setJournalSetting, reloadGrid } = this.props;
    const { columns, groupBy, sortBy, predicate } = journalSetting;

    this.setFilterToUrl({ groupBy, sortBy, predicate });

    setJournalSetting(journalSetting);
    reloadGrid({ columns, groupBy, sortBy, predicates: predicate ? [predicate] : [] });
    trigger.call(this, 'onApply');
  };

  setFilterToUrl = ({ groupBy, sortBy, predicate }) => {
    const {
      push,
      history: {
        location: { pathname, search }
      }
    } = this.props;
    const urlParams = {
      ...queryString.parse(search),
      filter: predicate ? JSON.stringify(predicate) : '',
      groupBy: groupBy ? JSON.stringify(groupBy) : '',
      sortBy: sortBy ? JSON.stringify(sortBy) : ''
    };

    push(`${pathname}?${queryString.stringify(urlParams)}`);
  };

  cancelSetting = () => {
    const { cancelJournalSettingData, journalSetting } = this.props;

    cancelJournalSettingData(journalSetting[JOURNAL_SETTING_ID_FIELD]);
    this.setFilterToUrl();
    trigger.call(this, 'onCancel');
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
      <Fragment>
        <Columns
          className={'ecos-journal__settings-footer'}
          cols={[
            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.openDialog}>
                {t('journals.action.create-template')}
              </Btn>
              {journalSetting[JOURNAL_SETTING_ID_FIELD] && <Btn onClick={this.saveSetting}>{t('journals.action.apply-template')}</Btn>}
            </Fragment>,

            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.cancelSetting}>
                {t('journals.action.reset')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.applySetting}>
                {t('journals.action.apply')}
              </Btn>
            </Fragment>
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
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(JournalsSettingsFooter));
