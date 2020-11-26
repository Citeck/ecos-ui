import React from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';

import { getPropByStringKey, t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, openSelectedJournal, openSelectedJournalSettings, renameJournalSetting } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { IcoBtn } from '../../common/btns';
import { RemoveDialog } from '../../common/dialogs';
import { Input, Well } from '../../common/form';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsMenu.scss';

const ITEM_HEIGHT = 41;
const HEIGHT_DIFF = 250;
const PAGE_TABS_HEIGHT_DIFF = 30;
const Labels = {
  HIDE_MENU: 'journals.action.hide-menu',
  HIDE_MENU_sm: 'journals.action.hide-menu_sm',
  EMPTY_LIST: 'journals.menu.journal-list.empty',
  JOURNALS_TITLE: 'journals.menu.journal-list.title',
  TEMPLATES_TITLE: 'journals.tpl.defaults',
  TEMPLATE_CANCEL: 'journals.action.cancel-rename-tpl-msg',
  TEMPLATE_RENAME: 'journals.action.rename-tpl-msg',
  TEMPLATE_REMOVE: 'journals.action.remove-tpl-msg',
  TEMPLATE_REMOVE_TITLE: 'journals.action.delete-tpl-msg',
  TEMPLATE_REMOVE_TEXT: 'journals.action.remove-tpl-msg'
};

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow,
    journals: newState.journals,
    journalSettings: newState.journalSettings,
    journalSetting: newState.journalSetting,
    journalConfig: newState.journalConfig
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    deleteJournalSetting: id => dispatch(deleteJournalSetting(w(id))),
    renameJournalSetting: options => dispatch(renameJournalSetting(w(options))),
    openSelectedJournalSettings: journalSettingId => dispatch(openSelectedJournalSettings(w(journalSettingId))),
    openSelectedJournal: journalId => dispatch(openSelectedJournal(w(journalId)))
  };
};

class ListItem extends React.Component {
  constructor(props) {
    super(props);

    const title = getPropByStringKey(props.item, props.titleField);

    this.state = {
      isMouseOver: false,
      isDialogShow: false,
      isRenameMode: false,
      title: title,
      _title: title
    };
  }

  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  delete = () => {
    trigger.call(this, 'onDelete', this.props.item);
    this.closeDialog();
  };

  apply = () => {
    const title = this.state._title;
    trigger.call(this, 'onApply', { id: this.props.item[JOURNAL_SETTING_ID_FIELD], title });
    this.setState({ title });
    this.hideRenameMode();
  };

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDialog = e => {
    e.stopPropagation();
    this.setState({ isDialogShow: true });
  };

  showRenameMode = e => {
    e.stopPropagation();
    this.setState({ isRenameMode: true });
  };

  hideRenameMode = () => {
    this.setState({ isRenameMode: false });
  };

  cancelRenameMode = () => {
    this.hideRenameMode();
    this.setState({ _title: this.state.title });
  };

  onChangeTitle = e => {
    this.setState({ _title: e.target.value });
  };

  onKeyPress = e => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      this.apply();
    }
  };

  onMouseOver = () => {
    this.setState({ isMouseOver: true });
  };

  onMouseLeave = () => {
    this.setState({ isMouseOver: false });
  };

  render() {
    const { item, removable } = this.props;
    const { isMouseOver, isDialogShow, isRenameMode, title, _title } = this.state;
    const hasActions = removable && !item.notRemovable && isMouseOver;

    return (
      <>
        {isRenameMode ? (
          <>
            <Input
              type={'text'}
              autoFocus
              autoSelect
              className="ecos-journal-menu__list-item-input"
              value={_title}
              onChange={this.onChangeTitle}
              onKeyPress={this.onKeyPress}
            />

            <IcoBtn
              title={t(Labels.TEMPLATE_CANCEL)}
              icon={'icon-small-close'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_red ecos-btn_hover_t_light-red ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_cancel`}
              onClick={this.cancelRenameMode}
            />

            <IcoBtn
              title={t(Labels.TEMPLATE_RENAME)}
              icon={'icon-small-check'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_green ecos-btn_hover_t_light-green ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_apply`}
              onClick={this.apply}
            />
          </>
        ) : (
          <div
            className={classNames('ecos-journal-menu__list-item', {
              'ecos-journal-menu__list-item_hover': isMouseOver,
              'ecos-journal-menu__list-item_actions': hasActions
            })}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
          >
            <span>{title}</span>

            {hasActions && (
              <>
                <IcoBtn
                  title={t(Labels.TEMPLATE_RENAME)}
                  icon={'icon-edit'}
                  className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_edit`}
                  onClick={this.showRenameMode}
                />
                <IcoBtn
                  title={t(Labels.TEMPLATE_REMOVE)}
                  icon={'icon-delete'}
                  className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__btn ecos-journal-menu__btn_delete`}
                  onClick={this.showDialog}
                />
              </>
            )}
          </div>
        )}

        <RemoveDialog
          isOpen={isDialogShow}
          title={t(Labels.TEMPLATE_REMOVE_TITLE)}
          text={t(Labels.TEMPLATE_REMOVE_TEXT, { name: title })}
          onCancel={this.closeDialog}
          onDelete={this.delete}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

class JournalsMenu extends React.Component {
  onClose = () => {
    const onClose = this.props.onClose;
    if (typeof onClose === 'function') {
      onClose.call(this);
    }
  };

  onJournalSelect = journal => {
    this.props.openSelectedJournal(journal.nodeRef);
  };

  onJournalSettingsSelect = setting => {
    this.props.openSelectedJournalSettings(setting[JOURNAL_SETTING_ID_FIELD]);
  };

  deleteJournalSettings = item => {
    this.props.deleteJournalSetting(item[JOURNAL_SETTING_ID_FIELD]);
  };

  renameJournalSetting = options => {
    this.props.renameJournalSetting(options);
  };

  getMenuJournals = journals => {
    return journals.map(journal => <ListItem onClick={this.onJournalSelect} item={journal} titleField={'title'} />);
  };

  getMenuJournalSettings = (settings, selectedIndex) => {
    return settings.map((setting, idx) => (
      <ListItem
        onClick={this.onJournalSettingsSelect}
        onDelete={this.deleteJournalSettings}
        onApply={this.renameJournalSetting}
        removable
        item={setting}
        selected={idx === selectedIndex}
        titleField={`${JOURNAL_SETTING_DATA_FIELD}.title`}
      />
    ));
  };

  getSelectedIndex = (source, value, field) => {
    for (let i = 0, count = source.length; i < count; i++) {
      if (source[i][field] === value) {
        return i;
      }
    }
    return undefined;
  };

  calculateHeight = (journals, journalSettings) => {
    const { height, pageTabsIsShow } = this.props;

    const itemHeight = ITEM_HEIGHT;
    const containerHeight = height - HEIGHT_DIFF + (pageTabsIsShow ? 0 : PAGE_TABS_HEIGHT_DIFF);
    const halfHeight = containerHeight / 2;

    const settingsCount = journalSettings.length;
    const journalsCount = journals.length;

    let settingsHeight = settingsCount * itemHeight;
    let journalsHeight = journalsCount * itemHeight;

    if (settingsHeight > halfHeight && journalsHeight > halfHeight) {
      settingsHeight = halfHeight;
      journalsHeight = halfHeight;
    } else if (settingsHeight > halfHeight && journalsHeight < halfHeight) {
      const freeHeight = halfHeight + halfHeight - journalsHeight;

      if (settingsHeight > freeHeight) {
        settingsHeight = freeHeight;
      }
    } else if (journalsHeight > halfHeight && settingsHeight < halfHeight) {
      const freeHeight = halfHeight + halfHeight - settingsHeight;

      if (journalsHeight > freeHeight) {
        journalsHeight = freeHeight;
      }
    }

    return { settingsHeight, journalsHeight };
  };

  render() {
    const {
      journalSetting,
      journalSettings,
      journals,
      open,
      journalConfig: {
        id: journalId,
        meta: { nodeRef }
      },
      pageTabsIsShow,
      isMobile,
      forwardedRef
    } = this.props;

    if (!open) {
      return null;
    }

    const journalSettingId = journalSetting[JOURNAL_SETTING_ID_FIELD];
    const menuJournalSettingsSelectedIndex = this.getSelectedIndex(journalSettings, journalSettingId, JOURNAL_SETTING_ID_FIELD);
    const { settingsHeight, journalsHeight } = this.calculateHeight(journals, journalSettings);

    return (
      <div
        ref={forwardedRef}
        className={classNames('ecos-journal-menu', {
          'ecos-journal-menu_open': open,
          'ecos-journal-menu_tabs': pageTabsIsShow,
          'ecos-journal-menu_mobile': isMobile
        })}
      >
        <div className="ecos-journal-menu__hide-menu-btn">
          <IcoBtn
            onClick={this.onClose}
            icon="icon-small-arrow-right"
            invert
            className="ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest"
          >
            {isMobile ? t(Labels.HIDE_MENU_sm) : t(Labels.HIDE_MENU)}
          </IcoBtn>
        </div>

        <Well className="ecos-journal-menu__journals">
          <CollapsibleList
            height={!isMobile && journalsHeight}
            classNameList={'ecos-list-group_mode_journal'}
            list={this.getMenuJournals(journals)}
            selected={this.getSelectedIndex(journals, nodeRef, 'nodeRef')}
            emptyText={t(Labels.EMPTY_LIST)}
          >
            {t(Labels.JOURNALS_TITLE)}
          </CollapsibleList>
        </Well>

        <Well className="ecos-journal-menu__presets">
          <CollapsibleList
            height={!isMobile && settingsHeight}
            classNameList="ecos-list-group_mode_journal"
            list={this.getMenuJournalSettings(journalSettings, menuJournalSettingsSelectedIndex)}
            selected={menuJournalSettingsSelectedIndex}
            emptyText={t(Labels.EMPTY_LIST)}
          >
            {t(Labels.TEMPLATES_TITLE)}
          </CollapsibleList>
        </Well>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsMenu);
