import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import { IcoBtn } from '../../common/btns';
import { initGrid } from '../../../actions/journals';
import { Well } from '../../common/form';
import CollapsableList from '../../common/CollapsableList/CollapsableList';
import { t } from '../../../helpers/util';

import './JournalsMenu.scss';

const mapStateToProps = state => ({
  journals: state.journals.journals,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  initGrid: options => dispatch(initGrid(options))
});

class ListItem extends Component {
  onClick = () => {
    const { onClick, journal } = this.props;
    onClick(journal);
  };

  render() {
    const { journal, titleField } = this.props;
    return <span onClick={this.onClick}>{journal[titleField]}</span>;
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
    this.props.initGrid(journal.nodeRef);
  };

  getMenuJornals = journals => {
    return journals.map(journal => <ListItem onClick={this.onJornalSelect} journal={journal} titleField={'title'} />);
  };

  getSelectedIndex = () => {
    const {
      journals,
      journalConfig: {
        meta: { nodeRef }
      }
    } = this.props;

    for (let i = 0, count = journals.length; i < count; i++) {
      if (journals[i].nodeRef === nodeRef) {
        return i;
      }
    }

    return undefined;
  };

  render() {
    const { journals, open } = this.props;

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
            {'Скрыть меню'}
          </IcoBtn>
        </div>

        <Well className={'ecos-journal-menu__journals'}>
          <CollapsableList
            classNameList={'ecos-list-group_mode_journal'}
            list={this.getMenuJornals(journals)}
            selected={this.getSelectedIndex()}
          >
            {t('journals.name')}
          </CollapsableList>
        </Well>

        <Well className={'ecos-journal-menu__presets'}>
          <CollapsableList classNameList={'ecos-list-group_mode_journal'} list={[]} close>
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
