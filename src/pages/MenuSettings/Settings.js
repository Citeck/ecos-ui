import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { initSettings, saveSettingsConfig, setOpenMenuSettings } from '../../actions/menuSettings';
import { t } from '../../helpers/util';
import { getPositionAdjustment } from '../../helpers/menu';
import { goToJournalsPage } from '../../helpers/urls';
import { MenuTypes } from '../../constants/menu';
import { EcosModal, Loader } from '../../components/common';
import { Btn, IcoBtn } from '../../components/common/btns';
import EditorItems from './EditorItems';

import './style.scss';

const Labels = {
  TITLE: 'menu-settings.header.title',
  TITLE_ITEMS: 'menu-settings.editor-items.title',
  GOTO_JOURNAL: 'menu-settings.header.btn.journal-menu-template',
  BTN_CANCEL: 'menu-settings.button.cancel',
  BTN_APPLY: 'menu-settings.button.apply'
};

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedType: props.type
    };
  }

  componentDidMount() {
    this.props.initSettings();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { type } = this.props;
    const state = {};

    if (type !== prevProps.type) {
      state.selectedType = type;
    }

    if (!isEmpty(state)) {
      this.setState(state);
    }
  }

  handleHideModal = () => {
    this.props.setOpenMenuSettings(false);
  };

  handleGoJournal = () => {
    this.handleHideModal(); //todo ref
    goToJournalsPage({
      journalId: 'menu-configs',
      journalsListId: 'global-system'
    });
  };

  handleCancel = () => {
    this.handleHideModal();
  };

  handleApply = () => {
    this.props.saveSettings();
  };

  draggablePositionAdjustment = () => {
    const { menuType } = this.props;

    return getPositionAdjustment(menuType);
  };

  setData = data => {
    this.setState(data);
  };

  renderButtons() {
    return (
      <div className="ecos-menu-settings__buttons">
        <Btn onClick={this.handleCancel}>{t(Labels.BTN_CANCEL)}</Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleApply}>
          {t(Labels.BTN_APPLY)}
        </Btn>
      </div>
    );
  }

  render() {
    const { isLoading } = this.props;
    const customButtons = [
      <IcoBtn
        key="ecos-menu-settings-btn-goto"
        invert
        icon={'icon-big-arrow'}
        className="ecos-menu-settings__btn-goto ecos-btn_narrow"
        onClick={this.handleGoJournal}
      >
        {t(Labels.GOTO_JOURNAL)}
      </IcoBtn>
    ];

    return (
      <EcosModal
        className="ecos-menu-settings__modal ecos-modal_width-m"
        isOpen
        isTopDivider
        isBigHeader
        hideModal={this.handleHideModal}
        title={t(Labels.TITLE)}
        customButtons={customButtons}
        classNameHeader="ecos-menu-settings__modal-header"
        reactstrapProps={{ backdrop: 'static' }}
      >
        {isLoading && <Loader blur className="ecos-menu-settings__loader" />}
        <div className="ecos-menu-settings__title">{t(Labels.TITLE_ITEMS)}</div>
        <EditorItems />
        {this.renderButtons()}
      </EcosModal>
    );
  }
}

const mapStateToProps = state => ({
  type: get(state, 'menuSettings.type', MenuTypes.LEFT),
  isLoading: get(state, 'menuSettings.isLoading')
});

const mapDispatchToProps = dispatch => ({
  initSettings: () => dispatch(initSettings()),
  saveSettings: payload => dispatch(saveSettingsConfig(payload)),
  setOpenMenuSettings: payload => dispatch(setOpenMenuSettings(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
