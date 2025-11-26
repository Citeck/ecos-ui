import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import React from 'react';
import { connect } from 'react-redux';

import { deleteJournalSetting, editJournalSetting, getJournalsData, openSelectedPreset } from '../../../actions/journals';
import { resetFilter } from '../../../actions/kanban';
import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { selectViewMode } from '../../../selectors/journals';
import { selectIsViewNewJournal } from '../../../selectors/view';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';

import ListItem from './ListItem';
import { filterList, renderList, onSelect } from './helpers';

import './style.scss';

class ListDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpenDropdown: false
    };
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

  changeIsOpen = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      this.setState({ isOpenDropdown });
    }
  };

  render() {
    const { isViewNewJournal, isMobile, journalSettings = [], searchText, journalSetting, toggleClassName, className } = this.props;
    const { isOpenDropdown } = this.state;

    const settingId = get(journalSetting, 'id', '');
    const displayName = (journalSettings || []).find(({ id }) => id === settingId)?.displayName;

    const isNotDefaultSetting = settingId !== '' && !!displayName;

    return (
      <div
        className={classNames('ecos-journal-menu__container', toggleClassName, {
          'ecos-journal-menu__container_mobile': isMobile && isViewNewJournal
        })}
      >
        <Dropdown
          hasEmpty
          isStatic
          scrollbarHeightMax={315}
          CustomItem={this.renderCustomItem}
          controlLabel={t('journal.presets.menu.title')}
          source={filterList({ journalSettings, searchText })}
          valueField={'id'}
          controlIcon="icon-small-down"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down')}
          toggleClassName={toggleClassName}
          className={className}
          withScrollbar
          onChange={this.onSelect}
          wrapperClassName="ecos-list-group"
          otherFuncForCustomItem={{
            onDelete: this.onDelete,
            onEdit: this.onEdit
          }}
          getStateOpen={this.changeIsOpen}
        >
          <IcoBtn
            invert
            icon="icon-small-down"
            className={classNames('ecos-journal__settings-bar-template-btn ecos-btn_hover_blue2 ecos-btn_drop-down ecos-btn_grey3', {
              'ecos-journal__btn_new template': isViewNewJournal,
              'ecos-journal__btn_new_selected': isViewNewJournal && isNotDefaultSetting,
              'ecos-journal__btn_new_focus': isViewNewJournal && isOpenDropdown
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

export default connect(mapStateToProps, mapDispatchToProps)(ListDropdown);
