import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import { IcoBtn } from '../../common/btns';
import { initGrid } from '../../../actions/journals';
import { Well } from '../../common/form';
import CollapsableList from '../../common/CollapsableList/CollapsableList';
import { t, getPropByStringKey } from '../../../helpers/util';

import './JournalsMenu.scss';

const mapStateToProps = state => ({
  journals: state.journals.journals,
  journalSettings: state.journals.journalSettings,
  journalSetting: state.journals.journalSetting,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  initGrid: options => dispatch(initGrid(options))
});

class ListItem extends Component {
  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  render() {
    const { item, titleField } = this.props;
    return <span onClick={this.onClick}>{getPropByStringKey(item, titleField)}</span>;
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
    this.props.initGrid({ journalId: journal.nodeRef, journalSettingId: this.props.journalSetting.id });
  };

  onJournalSettingsSelect = setting => {
    const {
      journalConfig: {
        meta: { nodeRef }
      }
    } = this.props;

    this.props.initGrid({ journalId: nodeRef, journalSettingId: setting.id });
  };

  getMenuJornals = journals => {
    return journals.map(journal => <ListItem onClick={this.onJornalSelect} item={journal} titleField={'title'} />);
  };

  getMenuJournalSettings = settings => {
    return settings.map(setting => <ListItem onClick={this.onJournalSettingsSelect} item={setting} titleField={'preferences.title'} />);
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
      journalSetting,
      journalSettings,
      journals,
      open,
      journalConfig: {
        meta: { nodeRef }
      }
    } = this.props;

    if (!open) {
      return null;
    }

    return (
      <div className={`ecos-journal-menu ${open ? 'ecos-journal-menu_open' : ''}`}>
        <div className={'ecos-journal-menu__hide-menu-btn'}>
          <IcoBtn
            onClick={this.onClose}
            icon={'icon-close'}
            invert={'true'}
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
            list={this.getMenuJournalSettings(journalSettings)}
            selected={this.getSelectedIndex(journalSettings, journalSetting.id, 'id')}
          >
            {t('journals.tpl.defaults')}
          </CollapsableList>
        </Well>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsMenu);
