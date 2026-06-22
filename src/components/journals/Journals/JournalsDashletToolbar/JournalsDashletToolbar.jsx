import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import GroupActions from '../GroupActions';
import { getCreateVariantKeyField } from '../service/util';

import { selectJournal } from '@/actions/journals';
import { IcoBtn, TwoIcoBtn } from '@/components/common/btns';
import { Dropdown } from '@/components/common/form';
import FormManager from '@/components/forms/EcosForm/FormManager';
import { wrapArgs } from '@/helpers/redux';
import { goToCardDetailsPage } from '@/helpers/urls';
import { selectJournalData, selectNewVersionDashletConfig } from '@/selectors/journals';

const mapStateToProps = (state, props) => {
  const ownState = selectJournalData(state, props.stateId);
  const config = selectNewVersionDashletConfig(state, props.stateId);

  return {
    journals: ownState.journals,
    journalConfig: ownState.journalConfig,
    journalSetting: ownState.journalSetting,
    journalSettings: ownState.journalSettings,
    grid: ownState.grid,
    selectedRecords: ownState.selectedRecords,
    selectedJournals: ownState.selectedJournals,
    config,
    recordRef: ownState.recordRef
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    selectJournal: journalId => dispatch(selectJournal(w(journalId)))
  };
};

class JournalsDashletToolbar extends Component {
  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: (record, postCreateActionExecuted) => {
        if (!postCreateActionExecuted) {
          goToCardDetailsPage(record.id);
        } else {
          this.props.handleReload && this.props.handleReload();
        }
      },
      initiator: {
        type: 'dashboard-journal-widget',
        dashboardRecordRef: this.props.recordRef
      }
    });
  };

  onChangeJournal = journal => {
    const { onChangeSelectedJournal, selectJournal } = this.props;

    selectJournal(journal.id);
    isFunction(onChangeSelectedJournal) && onChangeSelectedJournal(journal.id);
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
    const { stateId, selectedJournals, isSmall, lsJournalId, isHideCreateVariants } = this.props;
    const nodeRef = get(this.props, 'journalConfig.meta.nodeRef', '');

    return (
      <>
        <div ref={this.props.forwardRef} className="ecos-journal-dashlet__toolbar">
          {!isHideCreateVariants && this.renderCreateMenu()}

          {!!selectedJournals && selectedJournals.length > 1 && (
            <Dropdown
              hasEmpty
              source={selectedJournals.filter(journal => !!journal.title)}
              value={lsJournalId || nodeRef}
              valueField={'id'}
              titleField={'title'}
              className={classNames({ 'ecos-journal-dashlet__toolbar-dropdown_small': isSmall })}
              onChange={this.onChangeJournal}
            >
              <IcoBtn invert icon={'icon-small-down'} className="ecos-btn_drop-down ecos-btn_r_6 ecos-btn_x-step_10" />
            </Dropdown>
          )}
        </div>

        <div className="ecos-journal-dashlet__toolbar-extra">
          {isSmall && (
            <div className="ecos-journal-dashlet__group-actions">
              <GroupActions stateId={stateId} isMobile menuClassName="ecos-group-actions__dropdown-menu_widget" />
            </div>
          )}
        </div>
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(JournalsDashletToolbar);
