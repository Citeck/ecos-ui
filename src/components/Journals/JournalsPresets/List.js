import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, editJournalSetting, getJournalsData, openSelectedPreset } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { Well } from '../../common/form';
import { Labels } from '../constants';
import ListItem from './ListItem';

class List extends React.Component {
  componentDidMount() {
    const { getJournalsData } = this.props;

    isFunction(getJournalsData) && getJournalsData({ force: true });
  }

  onSelect = setting => {
    const { journalSetting = [] } = this.props;

    if (journalSetting.id !== setting.id) {
      this.props.openSelectedPreset(setting.id);
    } else {
      this.props.getJournalsData();
    }
  };

  onDelete = item => {
    this.props.deleteJournalSetting(item.id);
  };

  onEdit = item => {
    this.props.editJournalSetting(item.id);
  };

  filterList = () => {
    const { searchText, journalSettings = [] } = this.props;
    const compare = item => new RegExp(`(${searchText})`, 'ig').test(get(item, 'displayName'));
    return !searchText ? journalSettings : journalSettings.filter(compare);
  };

  get renderList() {
    const { journalSettings = [] } = this.props;
    return this.filterList(journalSettings).map(item => (
      <ListItem key={get(item, 'id')} onClick={this.onSelect} onDelete={this.onDelete} onEdit={this.onEdit} item={item} />
    ));
  }

  get selectedIndex() {
    const { journalSetting, journalSettings = [] } = this.props;
    return journalSettings.findIndex(item => item.id === (journalSetting.id || ''));
  }

  render() {
    return (
      <Well className="ecos-journal-menu__presets">
        <CollapsibleList
          needScrollbar={false}
          className="ecos-journal-menu__collapsible-list"
          classNameList="ecos-list-group_mode_journal"
          list={this.renderList}
          emptyText={t(Labels.Menu.EMPTY_LIST)}
          selected={this.selectedIndex}
        >
          {t(Labels.Preset.TEMPLATES_TITLE)}
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
