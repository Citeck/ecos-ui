import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';
import FormManager from '../../EcosForm/FormManager';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { onJournalSelect, onJournalSettingsSelect } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import { goToCardDetailsPage } from '../../../helpers/urls';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    journals: newState.journals,
    journalConfig: newState.journalConfig,
    journalSettings: newState.journalSettings,
    grid: newState.grid
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    onJournalSelect: journalId => dispatch(onJournalSelect(w(journalId))),
    onJournalSettingsSelect: journalSettingId => dispatch(onJournalSettingsSelect(w(journalSettingId)))
  };
};

class JournalsDashletToolbar extends Component {
  addRecord = () => {
    let {
      journalConfig: {
        meta: { createVariants = [{}] }
      }
    } = this.props;

    FormManager.createRecordByVariant(createVariants[0], {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  onChangeJournal = journal => this.props.onJournalSelect(journal.nodeRef);

  onChangeJournalSetting = setting => {
    this.props.onJournalSettingsSelect(setting[JOURNAL_SETTING_ID_FIELD]);
  };

  render() {
    const {
      stateId,
      journals,
      journalConfig,
      journalConfig: {
        meta: { nodeRef = '', createVariants }
      },
      journalSettings,
      measurer,
      isSmall,
      grid
    } = this.props;

    return (
      <div className={'ecos-journal-dashlet__toolbar'}>
        {createVariants[0] ? (
          <IcoBtn
            icon={'icon-big-plus'}
            className={
              'ecos-btn_i ecos-btn_i-big-plus ecos-btn_blue ecos-btn_hover_light-blue ecos-btn_x-step_10 ecos-journal-dashlet__create-btn'
            }
            onClick={this.addRecord}
          />
        ) : null}

        <Dropdown
          hasEmpty
          source={journals}
          value={nodeRef}
          valueField={'nodeRef'}
          titleField={'title'}
          className={classNames({
            'ecos-journal-dashlet__toolbar-dropdown_small': isSmall
          })}
          onChange={this.onChangeJournal}
        >
          <IcoBtn invert icon={'icon-down'} className={'ecos-btn_drop-down ecos-btn_r_6 ecos-btn_x-step_10'} />
        </Dropdown>

        {!isSmall && (
          <Dropdown
            source={journalSettings}
            value={0}
            valueField={JOURNAL_SETTING_ID_FIELD}
            titleField={`${JOURNAL_SETTING_DATA_FIELD}.title`}
            isButton={true}
            onChange={this.onChangeJournalSetting}
          >
            <TwoIcoBtn icons={['icon-settings', 'icon-down']} className={'ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10'} />
          </Dropdown>
        )}

        {!isSmall && <Export config={journalConfig} grid={grid} />}

        {!isSmall && (
          <div className={'ecos-journal-dashlet__actions'}>
            {measurer.xs || measurer.xxs || measurer.xxxs ? null : <JournalsDashletPagination stateId={stateId} />}
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletToolbar);
