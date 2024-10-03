import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, editJournalSetting, getJournalsData, openSelectedPreset } from '../../../actions/journals';
import { selectViewMode } from '../../../selectors/journals';
import { resetFilter } from '../../../actions/kanban';
import { Dropdown } from '../../common/form';
import { selectIsViewNewJournal } from '../../../selectors/view';
import classNames from 'classnames';
import { filterList, renderList, onSelect } from './helpers';
import ListItem from './ListItem';
import { t } from '../../../helpers/export/util';
import { IcoBtn } from '../../common/btns';

import './style.scss';

class ListDropdown extends React.Component {
  componentDidMount() {
    const { getJournalsData } = this.props;

    isFunction(getJournalsData) && getJournalsData({ force: true });
  }

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

  renderCustomItem = itemProps => {
    const { journalSetting } = this.props;
    const isSelected = get(journalSetting, 'id') === get(itemProps, 'item.id');

    return (
      <ListItem
        {...itemProps}
        className={classNames(
          'ecos-journal-menu__list-item ecos-journal-menu__list-item_new journal-preset__group-item list-group-item_new',
          {
            'list-group-item_selected': isSelected
          }
        )}
      />
    );
  };

  render() {
    const { isViewNewJournal, isMobile, journalSettings = [], searchText, journalSetting } = this.props;

    const settingId = get(journalSetting, 'id', '');
    const displayName = (journalSettings || []).find(({ id }) => id === settingId)?.displayName;

    const isNotDefaultSetting = settingId !== '' && !!displayName;

    return (
      <div
        className={classNames('ecos-journal-menu__container', {
          'ecos-journal-menu__container_mobile': isMobile && isViewNewJournal
        })}
      >
        <Dropdown
          hasEmpty
          isStatic
          scrollbarHeightMax={300}
          CustomItem={this.renderCustomItem}
          controlLabel={t('journal.presets.menu.title')}
          source={filterList({ journalSettings, searchText })}
          valueField={'id'}
          controlIcon="icon-small-down"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down')}
          withScrollbar
          onChange={this.onSelect}
          wrapperClassName="ecos-list-group"
          otherFuncForCustomItem={{
            onDelete: this.onDelete,
            onEdit: this.onEdit
          }}
        >
          <IcoBtn
            invert
            icon="icon-small-down"
            className={classNames('ecos-journal__settings-bar-template-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3', {
              'ecos-journal__btn_new template': isViewNewJournal,
              'ecos-journal__btn_new_selected': isViewNewJournal && isNotDefaultSetting
            })}
          >
            {isNotDefaultSetting ? displayName : t('journal.presets.menu.title')}
          </IcoBtn>
        </Dropdown>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};
  const viewMode = selectViewMode(state, props.stateId);
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    journalSetting: newState.journalSetting,
    journalSettings: newState.journalSettings,
    isMobile: get(state, 'view.isMobile'),
    isViewNewJournal,
    viewMode
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    kanbanResetFilter: () => dispatch(resetFilter({ stateId: props.stateId })),
    deleteJournalSetting: id => dispatch(deleteJournalSetting(w(id))),
    openSelectedPreset: id => dispatch(openSelectedPreset(w(id))),
    editJournalSetting: id => dispatch(editJournalSetting(w(id)))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListDropdown);
