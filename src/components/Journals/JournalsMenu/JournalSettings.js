import React from 'react';
import { connect } from 'react-redux';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, openSelectedJournalSettings, renameJournalSetting } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { Well } from '../../common/form';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';
import { Labels } from './constants';
import ListItem from './JournalsMenuListItem';

class JournalSettings extends React.Component {
  onSelect = setting => {
    this.props.openSelectedJournalSettings(setting[JOURNAL_SETTING_ID_FIELD]);
  };

  onDelete = item => {
    this.props.deleteJournalSetting(item[JOURNAL_SETTING_ID_FIELD]);
  };

  onRename = options => {
    this.props.renameJournalSetting(options);
  };

  getList = (settings, selectedIndex) => {
    return settings.map((setting, idx) => (
      <ListItem
        onClick={this.onSelect}
        onDelete={this.onDelete}
        onApply={this.onRename}
        removable
        item={setting}
        selected={idx === selectedIndex}
        titleField={`${JOURNAL_SETTING_DATA_FIELD}.title`}
      />
    ));
  };

  get selected() {
    const { journalSetting, journalSettings } = this.props;
    const journalSettingId = journalSetting[JOURNAL_SETTING_ID_FIELD];
    return journalSettings && journalSettings.findIndex(item => item[JOURNAL_SETTING_ID_FIELD] === journalSettingId);
  }

  render() {
    const { journalSettings } = this.props;

    return (
      <Well className="ecos-journal-menu__presets">
        <CollapsibleList
          needScrollbar={false}
          className="ecos-journal-menu__collapsible-list"
          classNameList="ecos-list-group_mode_journal"
          list={this.getList(journalSettings, this.selected)}
          selected={this.selected}
          emptyText={t(Labels.EMPTY_LIST)}
        >
          {t(Labels.TEMPLATES_TITLE)}
        </CollapsibleList>
      </Well>
    );
  }
}

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    journalSettings: newState.journalSettings,
    journalSetting: newState.journalSetting
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    deleteJournalSetting: id => dispatch(deleteJournalSetting(w(id))),
    renameJournalSetting: options => dispatch(renameJournalSetting(w(options))),
    openSelectedJournalSettings: journalSettingId => dispatch(openSelectedJournalSettings(w(journalSettingId)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalSettings);
