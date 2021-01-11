import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { getScrollbarWidth, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { deleteJournalSetting, openSelectedJournal, openSelectedJournalSettings, renameJournalSetting } from '../../../actions/journals';
import { CollapsibleList } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Well } from '../../common/form';
import { JOURNAL_VIEW_MODE } from '../constants';
import FoldersTree from '../DocLib/FoldersTree';
import { Labels } from './constants';
import ListItem from './JournalsMenuListItem';
import JournalSettings from './JournalSettings';

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
    openSelectedJournalSettings: journalSettingId => dispatch(openSelectedJournalSettings(w(journalSettingId))),
    openSelectedJournal: journalId => dispatch(openSelectedJournal(w(journalId)))
  };
};

class JournalsMenu extends React.Component {
  static propTypes = {
    height: PropTypes.number // needed to track changes in the height of the parent component
  };

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
    this.props.openSelectedJournal(journal.nodeRef);
  };

  getMenuJournals = journals => {
    return journals.map(journal => <ListItem onClick={this.onJournalSelect} item={journal} titleField={'title'} />);
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
    if (typeof this.props.forwardedRef === 'function') {
      this.props.forwardedRef(ref);
    }

    if (ref) {
      this._menuRef = ref;
    }
  };

  render() {
    const {
      stateId,
      journals,
      open,
      journalConfig: {
        meta: { nodeRef }
      },
      pageTabsIsShow,
      isMobile,
      viewMode
    } = this.props;

    if (!open) {
      return null;
    }

    const isDocLibMode = viewMode === JOURNAL_VIEW_MODE.DOC_LIB;

    return (
      <div
        ref={this.setRef}
        className={classNames('ecos-journal-menu', 'ecos-journal-menu_grid', {
          'ecos-journal-menu_open': open,
          'ecos-journal-menu_tabs': pageTabsIsShow,
          'ecos-journal-menu_mobile': isMobile
        })}
        style={{ maxHeight: this.getMaxMenuHeight() }}
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

        {!isDocLibMode && (
          <>
            <Well className="ecos-journal-menu__journals">
              <CollapsibleList
                needScrollbar={false}
                className="ecos-journal-menu__collapsible-list"
                classNameList="ecos-list-group_mode_journal"
                list={this.getMenuJournals(journals)}
                selected={this.getSelectedIndex(journals, nodeRef, 'nodeRef')}
                emptyText={t(Labels.EMPTY_LIST)}
              >
                {t(Labels.JOURNALS_TITLE)}
              </CollapsibleList>
            </Well>

            <JournalSettings stateId={stateId} />
          </>
        )}

        {isDocLibMode && <FoldersTree stateId={stateId} isMobile={isMobile} closeMenu={this.onClose} />}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsMenu);
