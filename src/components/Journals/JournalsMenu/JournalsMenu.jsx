import React from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import get from 'lodash/get';

import { getScrollbarWidth, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, onJournalSelect, onJournalSettingsSelect, renameJournalSetting } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Well } from '../../common/form';
import JournalsUrlManager from '../JournalsUrlManager';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';
import ListItem from './ListItem';

import './JournalsMenu.scss';

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

class JournalsMenu extends React.Component {
  _menuRef = null;

  state = {
    journalsHeight: 0,
    settingsHeight: 0
  };

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

  getMaxMenuHeight = () => {
    let height = document.body.offsetHeight;

    height -= get(document.querySelector('#alf-hd'), 'offsetHeight', 0);
    height -= get(document.querySelector('.page-tab'), 'offsetHeight', 0);

    if (this._menuRef) {
      const styles = window.getComputedStyle(this._menuRef, null);

      height -= parseInt(styles.getPropertyValue('padding-top'), 10) || 0;
      height -= parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    }

    height -= getScrollbarWidth();

    return height < 300 ? 300 : height;
  };

  setRef = ref => {
    this.props.forwardedRef(ref);

    if (ref) {
      this._menuRef = ref;
    }
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
    const urlParams = { journalId };

    if (journalSettingId) {
      urlParams.journalSettingId = journalSettingId;
      urlParams.userConfigId = '';
    }

    return (
      <JournalsUrlManager stateId={stateId} params={urlParams} isActivePage={isActivePage}>
        <div
          ref={this.setRef}
          className={classNames('ecos-journal-menu', 'ecos-journal-menu_grid', {
            'ecos-journal-menu_open': open,
            'ecos-journal-menu_tabs': pageTabsIsShow,
            'ecos-journal-menu_mobile': isMobile
          })}
          style={{ maxHeight: this.getMaxMenuHeight() }}
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
              needScrollbar={false}
              className="ecos-journal-menu__collapsible-list"
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
              needScrollbar={false}
              className="ecos-journal-menu__collapsible-list"
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
