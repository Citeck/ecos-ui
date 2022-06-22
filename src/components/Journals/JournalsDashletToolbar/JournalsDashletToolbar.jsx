import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { selectJournal, selectPreset } from '../../../actions/journals';
import { selectNewVersionDashletConfig } from '../../../selectors/journals';
import { wrapArgs } from '../../../helpers/redux';
import { goToCardDetailsPage } from '../../../helpers/urls';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import FormManager from '../../EcosForm/FormManager';
import JournalsDashletPagination from '../JournalsDashletPagination';
import { getCreateVariantKeyField } from '../service/util';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  return {
    journals: newState.journals,
    journalConfig: newState.journalConfig,
    journalSettings: newState.journalSettings,
    config: selectNewVersionDashletConfig(state, props.stateId),
    grid: newState.grid,
    recordRef: newState.recordRef,
    selectedRecords: newState.selectedRecords,
    selectedJournals: newState.selectedJournals
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    selectJournal: journalId => dispatch(selectJournal(w(journalId))),
    selectPreset: journalSettingId => dispatch(selectPreset(w(journalSettingId)))
  };
};

class JournalsDashletToolbar extends Component {
  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => goToCardDetailsPage(record.id)
    });
  };

  onChangeJournal = journal => {
    const { onChangeSelectedJournal, selectJournal } = this.props;

    selectJournal(journal.id);
    isFunction(onChangeSelectedJournal) && onChangeSelectedJournal(journal.id);
  };

  onChangeJournalSetting = setting => {
    this.props.selectPreset(setting.id);
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
      lsJournalId,
      recordRef
    } = this.props;
    const nodeRef = get(this.props, 'journalConfig.meta.nodeRef', '');
    const isWide = !isSmall;

    return (
      <div ref={this.props.forwardRef} className="ecos-journal-dashlet__toolbar">
        {this.renderCreateMenu()}

        {selectedJournals.length > 1 && (
          <Dropdown
            hasEmpty
            source={selectedJournals}
            value={lsJournalId || nodeRef}
            valueField={'id'}
            titleField={'title'}
            className={classNames({
              'ecos-journal-dashlet__toolbar-dropdown_small': isSmall
            })}
            onChange={this.onChangeJournal}
          >
            <IcoBtn invert icon={'icon-small-down'} className="ecos-btn_drop-down ecos-btn_r_6 ecos-btn_x-step_10" />
          </Dropdown>
        )}

        {isWide && (
          <Dropdown source={journalSettings} valueField={'id'} titleField={'displayName'} onChange={this.onChangeJournalSetting} isButton>
            <TwoIcoBtn icons={['icon-settings', 'icon-small-down']} className="ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10" />
          </Dropdown>
        )}

        {isWide && (
          <Export
            className="ecos-journal-dashlet__action-export"
            journalConfig={journalConfig}
            grid={grid}
            dashletConfig={config}
            recordRef={recordRef}
            selectedItems={selectedRecords}
          />
        )}

        {isWide && (
          <div className="ecos-journal-dashlet__actions">
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
