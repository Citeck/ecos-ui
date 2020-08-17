import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { onJournalSelect, onJournalSettingsSelect } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import { goToCardDetailsPage } from '../../../helpers/urls';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Export from '../../Export/Export';
import FormManager from '../../EcosForm/FormManager';
import JournalsDashletPagination from '../JournalsDashletPagination';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    journals: newState.journals,
    journalConfig: newState.journalConfig,
    journalSettings: newState.journalSettings,
    config: newState.config,
    grid: newState.grid,
    selectedRecords: newState.selectedRecords
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
  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  onChangeJournal = journal => this.props.onJournalSelect(journal.nodeRef);

  onChangeJournalSetting = setting => {
    this.props.onJournalSettingsSelect(setting[JOURNAL_SETTING_ID_FIELD]);
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

    return (
      <Dropdown hasEmpty isButton source={createVariants} valueField="destination" titleField="title" onChange={this.addRecord}>
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
      journals,
      journalConfig,
      journalConfig: {
        meta: { nodeRef = '' }
      },
      journalSettings,
      measurer,
      isSmall,
      grid,
      config,
      selectedRecords
    } = this.props;

    return (
      <div className="ecos-journal-dashlet__toolbar">
        {this.renderCreateMenu()}

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
          <IcoBtn invert icon={'icon-small-down'} className="ecos-btn_drop-down ecos-btn_r_6 ecos-btn_x-step_10" />
        </Dropdown>

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
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletToolbar);
