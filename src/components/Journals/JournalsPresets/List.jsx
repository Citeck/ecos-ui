import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, editJournalSetting, getJournalsData, openSelectedPreset } from '../../../actions/journals';
import { selectViewMode } from '../../../selectors/journals';
import { resetFilter } from '../../../actions/kanban';
import { CollapsibleList } from '../../common';
import { Well } from '../../common/form';
import { Labels } from '../constants';
import { selectIsViewNewJournal } from '../../../selectors/view';
import classNames from 'classnames';
import Export from '../../Export/Export';
import { onSelect, renderList, selectedIndex } from './helpers';

class List extends React.Component {
  onSelect = setting => {
    const { journalSetting, openSelectedPreset, getJournalsData, kanbanResetFilter, viewMode } = this.props;

    onSelect({
      setting,
      journalSetting,
      openSelectedPreset,
      getJournalsData,
      kanbanResetFilter,
      viewMode
    });
  };

  onDelete = item => {
    this.props.deleteJournalSetting(item.id);
  };

  onEdit = item => {
    this.props.editJournalSetting(item.id);
  };

  get renderList() {
    const { journalSettings = [], searchText } = this.props;

    return renderList({
      journalSettings,
      searchText,
      onDelete: this.onDelete,
      onEdit: this.onEdit,
      onSelect: this.onSelect
    });
  }

  render() {
    const { journalConfig, grid, selectedRecords, isViewNewJournal, loading, isMobile, journalSetting, journalSettings = [] } = this.props;

    return (
      <div
        className={classNames('ecos-journal-menu__container', {
          'ecos-journal-menu__container_mobile': isMobile && isViewNewJournal
        })}
      >
        <Well className="ecos-journal-menu__presets">
          <CollapsibleList
            isLoading={loading}
            needScrollbar={false}
            className="ecos-journal-menu__collapsible-list"
            classNameList="ecos-list-group_mode_journal"
            list={this.renderList}
            emptyText={t(Labels.Menu.EMPTY_LIST)}
            selected={selectedIndex({ journalSetting, journalSettings })}
          >
            {t(Labels.Preset.TEMPLATES_TITLE)}
          </CollapsibleList>
        </Well>
        {isMobile && isViewNewJournal && (
          <Export
            loading={loading}
            isViewNewJournal={isViewNewJournal}
            isMobile={isMobile}
            journalConfig={journalConfig}
            grid={grid}
            className="ecos-journal__settings-bar-export"
            classNameBtn={classNames('ecos-btn_i ecos-journal__settings-bar-export-btn', {
              'ecos-journal__btn_new': isViewNewJournal
            })}
            selectedItems={selectedRecords}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};
  const viewMode = selectViewMode(state, props.stateId);
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    journalSettings: newState.journalSettings,
    journalSetting: newState.journalSetting,
    journalConfig: newState.journalConfig,
    selectedRecords: newState.selectedRecords,
    grid: newState.grid,
    loading: newState.loading,
    isMobile: get(state, 'view.isMobile'),
    isViewNewJournal,
    viewMode
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    kanbanResetFilter: () => dispatch(resetFilter({ stateId: props.stateId })),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    deleteJournalSetting: id => dispatch(deleteJournalSetting(w(id))),
    editJournalSetting: id => dispatch(editJournalSetting(w(id))),
    openSelectedPreset: id => dispatch(openSelectedPreset(w(id)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(List);
