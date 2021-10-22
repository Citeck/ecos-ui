import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, editJournalSetting, openSelectedJournalSettings } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { Well } from '../../common/form';
import { DEFAULT_PRESET, Labels } from '../JournalsMenu/constants';
import PresetItem from './PresetItem';

class Presets extends React.Component {
  onSelect = setting => {
    this.props.openSelectedJournalSettings(setting.id);
  };

  onDelete = item => {
    this.props.deleteJournalSetting(item.id);
  };

  onEdit = item => {
    this.props.editJournalSetting(item.id);
  };

  get renderList() {
    const { journalSetting = {}, journalSettings = [] } = this.props;

    return [DEFAULT_PRESET, ...journalSettings].map(item => (
      <PresetItem
        onClick={this.onSelect}
        onDelete={this.onDelete}
        onEdit={this.onEdit}
        item={item}
        selected={item.id === journalSetting.id}
      />
    ));
  }

  render() {
    return (
      <Well className="ecos-journal-menu__presets">
        <CollapsibleList
          needScrollbar={false}
          className="ecos-journal-menu__collapsible-list"
          classNameList="ecos-list-group_mode_journal"
          list={this.renderList}
          emptyText={t(Labels.EMPTY_LIST)}
        >
          {t(Labels.TEMPLATES_TITLE)}
        </CollapsibleList>
      </Well>
    );
  }
}

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  return {
    journalSettings: newState.journalSettings,
    journalSetting: newState.journalSetting
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    deleteJournalSetting: id => dispatch(deleteJournalSetting(w(id))),
    editJournalSetting: id => dispatch(editJournalSetting(w(id))),
    openSelectedJournalSettings: id => dispatch(openSelectedJournalSettings(w(id)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Presets);
