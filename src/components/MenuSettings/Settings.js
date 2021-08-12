import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';

import { saveMenuSettings } from '../../actions/menuSettings';
import { t } from '../../helpers/util';
import { goToAdminPage } from '../../helpers/urls';
import { SystemJournals } from '../../constants';
import { MenuSettings, MenuTypes } from '../../constants/menu';
import MenuSettingsService from '../../services/MenuSettingsService';
import { EcosModal, Loader, Tabs } from '../common';
import { Btn, IcoBtn } from '../common/btns';
import { ErrorBoundary } from '../ErrorBoundary';
import { Labels } from './utils';
import EditorLeftMenu from './editorMenu/EditorLeftMenu';
import EditorCreateMenu from './editorMenu/EditorCreateMenu';
import EditorGroupPriority from './EditorGroupPriority';
import EditorOwnership from './editorMenu/EditorOwnership';

import './style.scss';

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedType: props.type,
      selectedTab: undefined,
      loadedTabs: []
    };
  }

  componentDidMount() {
    const selectedTab = 0;
    const loadedTabs = cloneDeep(this.state.loadedTabs);

    loadedTabs[selectedTab] = true;
    this.setState({ selectedTab, loadedTabs });
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

  get mainTabs() {
    return [
      { id: 'settings-menu-config', label: t(Labels.TAB_LEFT_MENU), _render: 'renderMenuConfigTab' },
      { id: 'settings-menu-create-config', label: t(Labels.TAB_CREATE_MENU), _render: 'renderMenuCreateConfigTab' },
      { id: 'settings-global-config', label: t(Labels.TAB_GLOBAL), _render: 'renderGlobalConfigTab' }
    ];
  }

  get activeTabId() {
    const { selectedTab } = this.state;
    return get(this.mainTabs, [selectedTab, 'id']);
  }

  handleHideModal = () => {
    MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);
  };

  handleGoJournal = () => {
    this.handleHideModal();
    goToAdminPage({
      journalId: SystemJournals.MENUS,
      type: MenuSettings.ItemTypes.JOURNAL
    });
  };

  handleCancel = () => {
    this.handleHideModal();
  };

  handleApply = () => {
    this.props.saveSettings();
  };

  setData = data => {
    this.setState(data);
  };

  handleClickTab = (selectedTab = 0) => {
    const loadedTabs = cloneDeep(this.state.loadedTabs);
    const newState = { selectedTab };

    if (!loadedTabs[selectedTab]) {
      loadedTabs[selectedTab] = true;
      newState.loadedTabs = loadedTabs;
    }

    this.setState(newState);
  };

  renderMenuInfo = () => {
    const { editedId } = this.props;

    return (
      <div className="ecos-menu-settings__card ">
        <div>
          <span className="ecos-menu-settings__card-label">{t(Labels.MENU_ID)}:</span>
          <span className="ecos-menu-settings__card-value">{editedId}</span>
        </div>
      </div>
    );
  };

  renderMenuConfigTab = key => {
    return (
      <ErrorBoundary
        key={key}
        className="ecos-menu-settings__error"
        title={t(Labels.ERROR_BOUNDARY_TITLE)}
        message={t(Labels.ERROR_BOUNDARY_MSG)}
      >
        <div className={classNames(`ecos-menu-settings__tab-content tab--${key}`, { 'd-none': this.activeTabId !== key })}>
          {this.renderMenuInfo()}

          <div className="ecos-menu-settings__tab-content-item ecos-menu-settings__tab-content-item_greedy">
            <div className="ecos-menu-settings__title">{t(Labels.TITLE_ITEMS)}</div>
            <EditorLeftMenu />
          </div>
          <div>
            <div className="ecos-menu-settings__title">{t(Labels.TITLE_OWNERSHIP)}</div>
            <EditorOwnership />
          </div>
        </div>
      </ErrorBoundary>
    );
  };

  renderGlobalConfigTab = key => {
    return (
      <div
        key={key}
        className={classNames(`ecos-menu-settings__tab-content ecos-menu-settings__tab-content_two-cols tab--${key}`, {
          'd-none': this.activeTabId !== key
        })}
      >
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.TITLE_GROUP_PRIORITY)}</div>
          <EditorGroupPriority />
        </div>
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.GLOBAL_TITLE)}</div>
          <div className="ecos-menu-settings__explanation">{t(Labels.GLOBAL_DESC)}</div>
        </div>
      </div>
    );
  };

  renderMenuCreateConfigTab = key => {
    return (
      <div key={key} className={classNames(`ecos-menu-settings__tab-content tab--${key}`, { 'd-none': this.activeTabId !== key })}>
        {this.renderMenuInfo()}
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.TITLE_ITEMS)}</div>
          <EditorCreateMenu />
        </div>
      </div>
    );
  };

  renderButtons() {
    const { editedId } = this.props;

    const isDisabled = () => {
      return !editedId;
    };

    return (
      <div className="ecos-menu-settings__buttons">
        <Btn onClick={this.handleCancel}>{t(Labels.BTN_CANCEL)}</Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleApply} disabled={isDisabled()}>
          {t(Labels.BTN_APPLY)}
        </Btn>
      </div>
    );
  }

  render() {
    const { loadedTabs } = this.state;
    const { isLoading, isAdmin, disabledEdit } = this.props;
    const customButtons = [];

    isAdmin &&
      customButtons.push(
        <IcoBtn
          key="ecos-menu-settings-btn-goto"
          invert
          icon="icon-arrow"
          className="ecos-menu-settings__btn-goto ecos-btn_narrow"
          onClick={this.handleGoJournal}
        >
          {t(Labels.GOTO_JOURNAL)}
        </IcoBtn>
      );

    return (
      <EcosModal
        className="ecos-menu-settings__modal ecos-modal_width-lg"
        isOpen
        isTopDivider
        isBigHeader
        hideModal={this.handleHideModal}
        title={t(Labels.TITLE)}
        customButtons={customButtons}
        classNameBody={classNames({ 'ecos-menu-settings_disabled': disabledEdit })}
        classNameHeader="ecos-menu-settings__modal-header"
        reactstrapProps={{ backdrop: 'static' }}
      >
        {isLoading && <Loader blur className="ecos-menu-settings__loader" />}

        <Tabs
          items={this.mainTabs}
          activeTabKey={this.activeTabId}
          onClick={this.handleClickTab}
          className="ecos-menu-settings__tabs"
          widthFull
          narrow
        />
        <div className="ecos-menu-settings__content-container">
          {this.mainTabs.map((item, i) => loadedTabs[i] && this[item._render](item.id))}
        </div>
        {!disabledEdit && this.renderButtons()}
      </EcosModal>
    );
  }
}

const mapStateToProps = state => ({
  isAdmin: get(state, 'user.isAdmin'),
  type: get(state, 'menu.type') || MenuTypes.LEFT,
  disabledEdit: get(state, 'menuSettings.disabledEdit'),
  isLoading: get(state, 'menuSettings.isLoading'),
  editedId: get(state, 'menuSettings.editedId')
});

const mapDispatchToProps = dispatch => ({
  saveSettings: payload => dispatch(saveMenuSettings(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
