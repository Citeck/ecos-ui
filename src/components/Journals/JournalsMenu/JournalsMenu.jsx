import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import CollapsableList from '../../common/CollapsableList/CollapsableList';
import JournalsUrlManager from '../JournalsUrlManager';
import { IcoBtn } from '../../common/btns';
import { RemoveDialog } from '../../common/dialogs';
import { Input, Well } from '../../common/form';
import { deleteJournalSetting, onJournalSelect, onJournalSettingsSelect, renameJournalSetting } from '../../../actions/journals';
import { getPropByStringKey, t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsMenu.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
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

class ListItem extends Component {
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
    const quotes = String.fromCharCode(8221);

    return (
      <Fragment>
        {isRenameMode ? (
          <Fragment>
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
              icon={'icon-close'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_red ecos-btn_hover_t_light-red ecos-btn_transparent ecos-journal-menu__cancel-btn`}
              onClick={this.cancelRenameMode}
            />

            <IcoBtn
              title={t('journals.action.rename-tpl-msg')}
              icon={'icon-check'}
              className={`ecos-btn ecos-btn_i_15 ecos-btn_r_0 ecos-btn_color_green ecos-btn_hover_t_light-green ecos-btn_transparent ecos-journal-menu__apply-btn`}
              onClick={this.apply}
            />
          </Fragment>
        ) : (
          <div
            className={`ecos-journal-menu__list-item ${isMouseOver ? 'ecos-journal-menu__list-item_hover' : ''}`}
            onClick={this.onClick}
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
          >
            <span>{title}</span>

            {removable && !item.notRemovable && isMouseOver ? (
              <Fragment>
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
              </Fragment>
            ) : null}
          </div>
        )}

        <RemoveDialog
          isOpen={isDialogShow}
          title={t('journals.action.delete-tpl-msg')}
          text={`${t('journals.action.remove-tpl-msg')} ${quotes + title + quotes} ?`}
          onCancel={this.closeDialog}
          onDelete={this.delete}
          onClose={this.closeDialog}
        />
      </Fragment>
    );
  }
}

class JournalsMenu extends Component {
  onClose = () => {
    const onClose = this.props.onClose;
    if (typeof onClose === 'function') {
      onClose.call(this);
    }
  };

  onJornalSelect = journal => {
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
    return journals.map(journal => <ListItem onClick={this.onJornalSelect} item={journal} titleField={'title'} />);
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
      pageTabsIsShow
    } = this.props;
    const journalSettingId = journalSetting[JOURNAL_SETTING_ID_FIELD];

    if (!open) {
      return null;
    }

    const menuJournalSettingsSelectedIndex = this.getSelectedIndex(journalSettings, journalSettingId, JOURNAL_SETTING_ID_FIELD);

    return (
      <JournalsUrlManager stateId={stateId} params={{ journalId, journalSettingId }}>
        <div className={`ecos-journal-menu ${open ? 'ecos-journal-menu_open' : ''} ${pageTabsIsShow ? 'ecos-journal-menu_tabs' : ''}`}>
          <div className={'ecos-journal-menu__hide-menu-btn'}>
            <IcoBtn
              onClick={this.onClose}
              icon={'icon-arrow'}
              invert
              className={'ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
            >
              {t('journals.action.hide-menu')}
            </IcoBtn>
          </div>

          <Well className={'ecos-journal-menu__journals'}>
            <CollapsableList
              classNameList={'ecos-list-group_mode_journal'}
              list={this.getMenuJornals(journals)}
              selected={this.getSelectedIndex(journals, nodeRef, 'nodeRef')}
            >
              {t('journals.name')}
            </CollapsableList>
          </Well>

          <Well className={'ecos-journal-menu__presets'}>
            <CollapsableList
              classNameList={'ecos-list-group_mode_journal'}
              list={this.getMenuJournalSettings(journalSettings, menuJournalSettingsSelectedIndex)}
              selected={menuJournalSettingsSelectedIndex}
            >
              {t('journals.tpl.defaults')}
            </CollapsableList>
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
