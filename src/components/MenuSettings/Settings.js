import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';

import { getAuthorityInfoByRefs, saveMenuSettings } from '../../actions/menuSettings';
import { t } from '../../helpers/util';
import { goToJournalsPage } from '../../helpers/urls';
import { MenuTypes } from '../../constants/menu';
import MenuSettingsService from '../../services/MenuSettingsService';
import { EcosModal, Loader, Tabs } from '../common';
import { Btn, IcoBtn } from '../common/btns';
import { SelectOrgstruct } from '../common/form';
import EditorItems from './EditorItems';
import EditorGroupPriority from './EditorGroupPriority';

import './style.scss';

const Labels = {
  TITLE: 'menu-settings.header.title',
  TITLE_ITEMS: 'menu-settings.editor-items.title',
  TITLE_OWNERSHIP: 'menu-settings.editor-ownership.title',
  TITLE_GROUP_PRIORITY: 'menu-settings.editor-group-priority.title',
  GOTO_JOURNAL: 'menu-settings.header.btn.journal-menu-template',
  GLOBAL_DESC: 'menu-settings.desc.global-config',
  GLOBAL_TITLE: 'menu-settings.editor-global-settings.title',
  BTN_CANCEL: 'menu-settings.button.cancel',
  BTN_APPLY: 'menu-settings.button.apply'
};

const FIX_PLACE_H = 300;

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedType: props.type,
      selectedTab: undefined,
      loadedTabs: [],
      heightContent: window.innerHeight - FIX_PLACE_H
    };
  }

  componentDidMount() {
    const selectedTab = 0;
    const loadedTabs = cloneDeep(this.state.loadedTabs);

    loadedTabs[selectedTab] = true;
    this.setState({ selectedTab, loadedTabs });

    window.addEventListener('resize', this.resizeWindow);
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

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeWindow);
  }

  get authorityRefs() {
    return this.props.authorities.map(item => item.ref);
  }

  get mainTabs() {
    return [
      { id: 'settings-menu-config', label: t('menu-settings.tabs.menu-config') },
      { id: 'settings-global-config', label: t('menu-settings.tabs.global-config') }
    ];
  }

  get activeTabId() {
    const { selectedTab } = this.state;
    return get(this.mainTabs, [selectedTab, 'id']);
  }

  resizeWindow = debounce(() => {
    this.setState({ heightContent: window.innerHeight - FIX_PLACE_H });
  }, 300);

  handleHideModal = () => {
    MenuSettingsService.emitter.emit(MenuSettingsService.Events.HIDE);
  };

  handleGoJournal = () => {
    this.handleHideModal();
    goToJournalsPage({
      journalId: 'ecos-menus',
      journalsListId: 'global-system'
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

  handleSelectOrg = data => {
    this.props.getAuthorityInfoByRefs(data);
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

  renderMenuConfigTab(key) {
    const { disabledEdit, editedId } = this.props;

    return (
      <div className={classNames(`ecos-menu-settings__tab-content tab--${key}`, { 'd-none': this.activeTabId !== key })}>
        <div className="ecos-menu-settings__card ">
          <div>
            <span className="ecos-menu-settings__card-label">{t('menu-settings.data.id')}:</span>
            <span className="ecos-menu-settings__card-value">{editedId}</span>
          </div>
        </div>
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.TITLE_ITEMS)}</div>
          <EditorItems />
        </div>
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.TITLE_OWNERSHIP)}</div>
          <div className="ecos-menu-settings-ownership">
            <SelectOrgstruct
              defaultValue={this.authorityRefs}
              multiple
              onChange={this.handleSelectOrg}
              isSelectedValueAsText
              viewOnly={disabledEdit}
            />
          </div>
        </div>
      </div>
    );
  }

  renderGlobalConfigTab(key) {
    return (
      <div
        className={classNames(`ecos-menu-settings__tab-content ecos-menu-settings__tab-content_two-cols tab--${key}`, {
          'd-none': this.activeTabId !== key
        })}
      >
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.TITLE_GROUP_PRIORITY)}</div>
          <EditorGroupPriority heightContent={this.state.heightContent} />
        </div>
        <div>
          <div className="ecos-menu-settings__title">{t(Labels.GLOBAL_TITLE)}</div>
          <div className="ecos-menu-settings__explanation">{t(Labels.GLOBAL_DESC)}</div>
        </div>
      </div>
    );
  }

  renderButtons() {
    const { editedId, authorities } = this.props;

    const isDisabled = () => {
      return !editedId || !(authorities || []).length;
    };

    return (
      <div className="ecos-menu-settings__buttons">
        {/*<Btn className="ecos-btn_red" onClick={this.handleReset}>Delete</Btn>*/}
        <Btn onClick={this.handleCancel}>{t(Labels.BTN_CANCEL)}</Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleApply} disabled={isDisabled()}>
          {t(Labels.BTN_APPLY)}
        </Btn>
      </div>
    );
  }

  render() {
    const { loadedTabs, heightContent } = this.state;
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
        <div className="ecos-menu-settings__content-container" style={{ height: `${heightContent}px` }}>
          {loadedTabs[0] && this.renderMenuConfigTab(this.mainTabs[0].id)}
          {loadedTabs[1] && this.renderGlobalConfigTab(this.mainTabs[1].id)}
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
  authorities: get(state, 'menuSettings.authorities') || [],
  isLoading: get(state, 'menuSettings.isLoading'),
  editedId: get(state, 'menuSettings.editedId')
});

const mapDispatchToProps = dispatch => ({
  saveSettings: payload => dispatch(saveMenuSettings(payload)),
  getAuthorityInfoByRefs: payload => dispatch(getAuthorityInfoByRefs(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
