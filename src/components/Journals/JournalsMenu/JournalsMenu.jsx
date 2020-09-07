import React from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';

import { getPropByStringKey, t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, onJournalSelect, onJournalSettingsSelect, renameJournalSetting } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { IcoBtn } from '../../common/btns';
import { RemoveDialog } from '../../common/dialogs';
import { Input, Well } from '../../common/form';
import JournalsUrlManager from '../JournalsUrlManager';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsMenu.scss';

const ITEM_HEIGHT = 41;
const HEIGHT_DIFF = 250;
const PAGE_TABS_HEIGHT_DIFF = 30;

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
    onJournalSettingsSelect: journalSettingId => dispatch(onJournalSettingsSelect(w(journalSettingId))),
    onJournalSelect: journalId => dispatch(onJournalSelect(w(journalId)))
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

    return (
      <>
        {isRenameMode ? (
          <>
            <Input
              type={'text'}
              autoFocus
              autoSelect
              className={'ecos-journal-menu__list-item-input'}
              value={_title}
              onChange={this.onChangeTitle}
              onKeyPress={this.onKeyPress}
            />

            <IcoBtn
              title={t('journals.action.cancel-rename-tpl-msg')}
              icon={'icon-small-close'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_red ecos-btn_hover_t_light-red ecos-btn_transparent ecos-journal-menu__cancel-btn`}
              onClick={this.cancelRenameMode}
            />

            <IcoBtn
              title={t('journals.action.rename-tpl-msg')}
              icon={'icon-small-check'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_green ecos-btn_hover_t_light-green ecos-btn_transparent ecos-journal-menu__apply-btn`}
              onClick={this.apply}
            />
          </>
        ) : (
          <div
            className={`ecos-journal-menu__list-item ${isMouseOver ? 'ecos-journal-menu__list-item_hover' : ''}`}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
          >
            <span>{title}</span>

            {removable && !item.notRemovable && isMouseOver ? (
              <>
                <IcoBtn
                  title={t('journals.action.rename-tpl-msg')}
                  icon={'icon-edit'}
                  className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__edit-btn`}
                  onClick={this.showRenameMode}
                />
                <IcoBtn
                  title={t('journals.action.remove-tpl-msg')}
                  icon={'icon-delete'}
                  className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_blue-light2 ecos-btn_hover_t_white ecos-btn_transparent ecos-journal-menu__delete-btn`}
                  onClick={this.showDialog}
                />
              </>
            ) : null}
          </div>
        )}

        <RemoveDialog
          isOpen={isDialogShow}
          title={t('journals.action.delete-tpl-msg')}
          text={t('journals.action.remove-tpl-msg', { name: title })}
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
    this.props.onJournalSelect(journal.nodeRef);
  };

  onJournalSettingsSelect = setting => {
    this.props.onJournalSettingsSelect(setting[JOURNAL_SETTING_ID_FIELD]);
  };

  deleteJournalSettings = item => {
    this.props.deleteJournalSetting(item[JOURNAL_SETTING_ID_FIELD]);
  };

  renameJournalSetting = options => {
    this.props.renameJournalSetting(options);
  };

  getMenuJornals = journals => {
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
      stateId,
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
      isActivePage
    } = this.props;

    if (!open) {
      return null;
    }

    const journalSettingId = journalSetting[JOURNAL_SETTING_ID_FIELD];
    const menuJournalSettingsSelectedIndex = this.getSelectedIndex(journalSettings, journalSettingId, JOURNAL_SETTING_ID_FIELD);
    const { settingsHeight, journalsHeight } = this.calculateHeight(journals, journalSettings);
    const urlParams = { journalId };

    if (journalSettingId) {
      urlParams.journalSettingId = journalSettingId;
      urlParams.userConfigId = '';
    }

    return (
      <JournalsUrlManager stateId={stateId} params={urlParams} isActivePage={isActivePage}>
        <div
          className={classNames('ecos-journal-menu', {
            'ecos-journal-menu_open': open,
            'ecos-journal-menu_tabs': pageTabsIsShow,
            'ecos-journal-menu_mobile': isMobile
          })}
        >
          <div className={'ecos-journal-menu__hide-menu-btn'}>
            <IcoBtn
              onClick={this.onClose}
              icon={'icon-small-arrow-right'}
              invert
              className={'ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
            >
              {isMobile ? t('journals.action.hide-menu_sm') : t('journals.action.hide-menu')}
            </IcoBtn>
          </div>

          <Well className={'ecos-journal-menu__journals'}>
            <CollapsibleList
              height={!isMobile && journalsHeight}
              classNameList={'ecos-list-group_mode_journal'}
              list={this.getMenuJornals(journals)}
              selected={this.getSelectedIndex(journals, nodeRef, 'nodeRef')}
              emptyText={t('journals.menu.journal-list.empty')}
            >
              {t('journals.menu.journal-list.title')}
            </CollapsibleList>
          </Well>

          <Well className={'ecos-journal-menu__presets'}>
            <CollapsibleList
              height={!isMobile && settingsHeight}
              classNameList={'ecos-list-group_mode_journal'}
              list={this.getMenuJournalSettings(journalSettings, menuJournalSettingsSelectedIndex)}
              selected={menuJournalSettingsSelectedIndex}
            >
              {t('journals.tpl.defaults')}
            </CollapsibleList>
          </Well>
        </div>
      </JournalsUrlManager>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsMenu);
