import React from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';

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

  get selected() {
    const { journalSetting, journalSettings } = this.props;
    const journalSettingId = journalSetting[JOURNAL_SETTING_ID_FIELD];

    return journalSettings && journalSettings.findIndex(item => (item[JOURNAL_SETTING_ID_FIELD] || '') === (journalSettingId || ''));
  }

  get renderList() {
    const { journalSettings } = this.props;

    return journalSettings && journalSettings.map((setting, idx) => <this.renderItem item={setting} selected={idx === this.selected} />);
  }

  renderItem = React.memo(
    ({ item, selected }) => (
      <ListItem
        onClick={this.onSelect}
        onDelete={this.onDelete}
        onApply={this.onRename}
        removable
        item={item}
        selected={selected}
        titleField={`${JOURNAL_SETTING_DATA_FIELD}.title`}
      />
    ),
    (prevProps, nextProps) => isEqual(prevProps.item, nextProps.item) && prevProps.selected === nextProps.selected
  );

  render() {
    return (
      <Well className="ecos-journal-menu__presets">
        <CollapsibleList
          needScrollbar={false}
          className="ecos-journal-menu__collapsible-list"
          classNameList="ecos-list-group_mode_journal"
          list={this.renderList}
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
    journalSettings: newState.journalSettings || [],
    journalSetting: newState.journalSetting || {}
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
