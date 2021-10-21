import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { selectJournal, selectJournalSettings } from '../../../actions/journals';
import { selectJournalData, selectNewVersionDashletConfig } from '../../../selectors/journals';
import { wrapArgs } from '../../../helpers/redux';
import { goToCardDetailsPage } from '../../../helpers/urls';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import FormManager from '../../EcosForm/FormManager';
import { getCreateVariantKeyField } from '../service/util';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';
import JournalsDashletPagination from '../JournalsDashletPagination';
import GroupActions from '../GroupActions';

const mapStateToProps = (state, props) => {
  const ownState = selectJournalData(state, props.stateId);
  const config = selectNewVersionDashletConfig(state, props.stateId);

  return {
    journals: ownState.journals,
    journalConfig: ownState.journalConfig,
    journalSettings: ownState.journalSettings,
    grid: ownState.grid,
    selectedRecords: ownState.selectedRecords,
    selectedJournals: ownState.selectedJournals,
    config
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    onSelectJournal: journalId => dispatch(selectJournal(w(journalId))),
    onSelectJournalSettings: journalSettingId => dispatch(selectJournalSettings(journalSettingId))
  };
};

class JournalsDashletToolbar extends Component {
  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  onChangeJournal = journal => {
    const { onChangeSelectedJournal, onSelectJournal } = this.props;

    onSelectJournal(journal.id);

    if (typeof onChangeSelectedJournal === 'function') {
      onChangeSelectedJournal(journal.id);
    }
  };

  onChangeJournalSetting = setting => {
    this.props.onSelectJournalSettings(setting[JOURNAL_SETTING_ID_FIELD] || '');
  };

  renderCreateMenu = () => {
    const createVariants = get(this.props, 'journalConfig.meta.createVariants') || [];

    if (!createVariants.length) {
      return null;
    }

    if (createVariants.length === 1) {
      return (
        <IcoBtn
          icon={'icon-small-plus'}
          className="ecos-btn_i ecos-btn_blue ecos-btn_hover_light-blue ecos-btn_x-step_10 ecos-journal-dashlet__create-btn"
          onClick={() => this.addRecord(createVariants[0])}
        />
      );
    }

    const keyFields = getCreateVariantKeyField(createVariants[0]);

    return (
      <Dropdown
        hasEmpty
        isButton
        source={createVariants}
        keyFields={keyFields}
        valueField="destination"
        titleField="title"
        onChange={this.addRecord}
      >
        <TwoIcoBtn
          icons={['icon-small-plus', 'icon-small-down']}
          className="ecos-btn_settings-down ecos-btn_blue ecos-btn_hover_light-blue ecos-btn_x-step_10 ecos-journal-dashlet__create-btn"
        />
      </Dropdown>
    );
  };

  render() {
    const {
      stateId,
      journalConfig,
      selectedJournals,
      journalSettings,
      measurer,
      isSmall,
      grid,
      config,
      selectedRecords,
      lsJournalId
    } = this.props;
    const nodeRef = get(this.props, 'journalConfig.meta.nodeRef', '');

    return (
      <>
        <div ref={this.props.forwardRef} className="ecos-journal-dashlet__toolbar">
          {this.renderCreateMenu()}

          {!!selectedJournals && selectedJournals.length > 1 && (
            <Dropdown
              hasEmpty
              source={selectedJournals}
              value={lsJournalId || nodeRef}
              valueField={'id'}
              titleField={'title'}
              className={classNames({ 'ecos-journal-dashlet__toolbar-dropdown_small': isSmall })}
              onChange={this.onChangeJournal}
            >
              <IcoBtn invert icon={'icon-small-down'} className="ecos-btn_drop-down ecos-btn_r_6 ecos-btn_x-step_10" />
            </Dropdown>
          )}

          {!isSmall && (
            <Dropdown
              source={journalSettings}
              value={0}
              valueField={JOURNAL_SETTING_ID_FIELD}
              titleField={`${JOURNAL_SETTING_DATA_FIELD}.title`}
              isButton
              onChange={this.onChangeJournalSetting}
            >
              <TwoIcoBtn icons={['icon-settings', 'icon-small-down']} className="ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10" />
            </Dropdown>
          )}

          {!isSmall && (
            <div className="ecos-journal-dashlet__group-actions">
              <GroupActions stateId={stateId} />
            </div>
          )}

          {!isSmall && (
            <Export
              className="ecos-journal-dashlet__action-export"
              journalConfig={journalConfig}
              grid={grid}
              dashletConfig={config}
              selectedItems={selectedRecords}
            />
          )}

          {!isSmall && (
            <div className="ecos-journal-dashlet__actions">
              {measurer.xs || measurer.xxs || measurer.xxxs ? null : <JournalsDashletPagination stateId={stateId} />}
            </div>
          )}
        </div>
        <div className="ecos-journal-dashlet__toolbar-extra">
          {isSmall && (
            <div className="ecos-journal-dashlet__group-actions">
              <GroupActions stateId={stateId} isMobile />
            </div>
          )}
        </div>
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletToolbar);
