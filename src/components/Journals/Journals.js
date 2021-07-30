import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import merge from 'lodash/merge';

import {
  applyJournalSetting,
  createJournalSetting,
  execJournalAction,
  execRecordsAction,
  getJournalsData,
  onJournalSettingsSelect,
  reloadGrid,
  restoreJournalSettingData,
  runSearch,
  saveJournalSetting,
  setGrid,
  setSelectAllRecords,
  setSelectedRecords,
  setUrl
} from '../../actions/journals';
import { initDocLib } from '../../actions/docLib';
import { selectDocLibPageProps } from '../../selectors/docLib';
import { selectJournalPageProps } from '../../selectors/journals';
import { JournalUrlParams as JUP, SourcesId } from '../../constants';
import { animateScrollTo, getBool, getScrollbarWidth, objectCompare, t } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams, goToCardDetailsPage, removeUrlSearchParams, updateCurrentUrl } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import { showModalJson } from '../../helpers/tools';
import FormManager from '../EcosForm/FormManager';
import { ActionTypes } from '../Records/actions';

import { isDocLib, isPreview, JOURNAL_MIN_HEIGHT, JOURNAL_VIEW_MODE } from './constants';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsMenu from './JournalsMenu';
import JournalsSettingsBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';
import SettingsModal from './SettingsModal';
import { JournalsGroupActionsTools } from './JournalsTools';
import DocLibBreadcrumbs from './DocLib/DocLibBreadcrumbs';
import DocLibSettingsBar from './DocLib/DocLibSettingsBar';
import DocLibPagination from './DocLib/DocLibPagination';
import DocLibGroupActions from './DocLib/DocLibGroupActions';
import FilesViewer from './DocLib/FilesViewer';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const journalProps = selectJournalPageProps(state, props.stateId);
  const doclibProps = selectDocLibPageProps(state, props.stateId);

  return {
    isAdmin: get(state, 'user.isAdmin'),
    isMobile: get(state, 'view.isMobile'),
    pageTabsIsShow: get(state, 'pageTabs.isShow'),
    _url: window.location.href,
    ...journalProps,
    ...doclibProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    clearSearch: () => dispatch(setGrid({ search: '', stateId: props.stateId })),
    restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting))),
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    onJournalSettingsSelect: id => dispatch(onJournalSettingsSelect(w(id))),
    applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    createJournalSetting: (journalId, settings) => dispatch(createJournalSetting(w({ journalId, settings }))),
    saveJournalSetting: (id, settings) => dispatch(saveJournalSetting(w({ id, settings }))),
    initDocLib: () => dispatch(initDocLib(w({})))
  };
};

const defaultDisplayElements = {
  menu: true,
  header: true,
  settings: true,
  pagination: true,
  groupActions: true,
  editJournal: true
};

const Labels = {
  J_SHOW_MENU: 'journals.action.show-menu',
  J_SHOW_MENU_SM: 'journals.action.show-menu_sm',
  DL_SHOW_MENU: 'journals.action.show-folder-tree',
  DL_SHOW_MENU_SM: 'journals.action.show-folder-tree_sm',
  UNAVAILABLE_VIEW: 'journal.page.unavailable-view'
};

class Journals extends React.Component {
  _journalRef = null;
  _journalBodyRef = null;
  _beforeJournalBlockRef = null;
  _journalFooterRef = null;
  _journalMenuRef = null;
  _toggleMenuTimerId = null;

  constructor(props) {
    super(props);

    const showPreview = getBool(get(getSearchParams(), JUP.SHOW_PREVIEW));
    let viewMode = getBool(get(getSearchParams(), JUP.VIEW_MODE));

    if (showPreview && !viewMode) {
      viewMode = JOURNAL_VIEW_MODE.PREVIEW;
    }

    this.state = {
      menuOpen: false,
      isReset: false,
      isForceUpdate: false,
      menuOpenAnimate: false,
      settingsVisible: false,
      isCreateLoading: false,
      savedSetting: null,
      wasOpenedDocLib: false,
      viewMode
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newState = {};
    const journalId = get(props, ['urlParams', JUP.JOURNAL_ID]);

    if (props.isActivePage && journalId !== state.journalId) {
      newState = merge(newState, { journalId });
    }

    if (
      !state.isReset &&
      state.settingsVisible &&
      state.savedSetting &&
      !objectCompare(props.predicate, get(state, 'savedSetting.predicate', {}))
    ) {
      const savedSetting = merge(state.savedSetting, { predicate: props.predicate });
      newState = merge(newState, { savedSetting });
    }

    if (!newState) {
      return null;
    }

    return newState;
  }

  componentDidMount() {
    this.props.setUrl(getSearchParams());
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {
      _url,
      urlParams,
      stateId,
      isActivePage,
      isLoading,
      getJournalsData,
      reloadGrid,
      setUrl,
      onJournalSettingsSelect,
      initDocLib,
      docLibTypeRef,
      isDocLibEnabled
    } = this.props;
    const { journalId: stateJournalId, viewMode: stateViewMode, isForceUpdate: stateIsForceUpdate, wasOpenedDocLib } = this.state;
    const stateShowPreview = this.isPreviewMode;

    const prevJournalId = get(prevProps.urlParams, JUP.JOURNAL_ID);
    const newJournalId = get(urlParams, JUP.JOURNAL_ID);
    const urlShowPreview = getBool(get(getSearchParams(), JUP.SHOW_PREVIEW));
    const urlViewMode = get(getSearchParams(), JUP.VIEW_MODE);

    let newState;
    let newUrl;

    const isNewJournalOnActive =
      isActivePage &&
      ((prevProps.isActivePage && newJournalId && newJournalId !== prevJournalId) || stateJournalId !== prevState.journalId);

    const isEqualQuery = equalsQueryUrls({
      urls: [_url, prevProps._url],
      ignored: [JUP.SHOW_PREVIEW, JUP.VIEW_MODE, JUP.DOCLIB_FOLDER_ID, JUP.DOCLIB_SEARCH]
    });

    const isActiveChanged = isActivePage && prevProps.isActivePage && !isEqualQuery;

    if (isActiveChanged || prevProps.stateId !== stateId) {
      setUrl(getSearchParams());
    }

    if (isNewJournalOnActive || prevProps.stateId !== stateId) {
      newState = merge(newState, { wasOpenedDocLib: false });
      getJournalsData();
    }

    if (isActivePage && isDocLibEnabled && docLibTypeRef && !wasOpenedDocLib && this.isDocLibMode) {
      newState = merge(newState, { wasOpenedDocLib: true });
      initDocLib();
    }

    const isSameSettingId = equalsQueryUrls({ urls: [_url, prevProps._url], compareBy: [JUP.JOURNAL_SETTING_ID] });
    const isSameSearchParam = equalsQueryUrls({ urls: [_url, prevProps._url], compareBy: [JUP.SEARCH] });

    if (isActiveChanged && !isSameSettingId) {
      onJournalSettingsSelect(get(getSearchParams(), JUP.JOURNAL_SETTING_ID) || '');
    }

    if ((isActivePage && stateIsForceUpdate) || (isActiveChanged && !isSameSearchParam)) {
      newState = merge(newState, { isForceUpdate: false });
      reloadGrid();
    }

    if (prevProps.isActivePage && !isActivePage && isLoading) {
      newState = merge(newState, { isForceUpdate: true });
    }

    if (isActivePage && urlShowPreview !== stateShowPreview) {
      newUrl = merge(newUrl, { showPreview: stateShowPreview });
    }

    if (isActivePage && urlViewMode !== stateViewMode) {
      newUrl = merge(newUrl, { viewMode: stateViewMode });
    }

    newState && this.setState(newState);
    newUrl && updateCurrentUrl(newUrl);
  }

  componentWillUnmount() {
    this.handleForceUpdate.cancel();
    this.setHeight.cancel();
    this.handleEditJournal.cancel();

    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
      this._toggleMenuTimerId = null;
    }
  }

  get isOpenGroupActions() {
    const { grid, selectedRecords, selectAllRecords } = this.props;

    if (isEmpty(selectedRecords) && !selectAllRecords) {
      return false;
    }

    const forRecords = get(grid, 'actions.forRecords', {});
    const forQuery = get(grid, 'actions.forQuery', {});
    const groupActions = (selectAllRecords ? forQuery.actions : forRecords.actions) || [];

    return !isEmpty(groupActions);
  }

  get displayElements() {
    return {
      ...defaultDisplayElements,
      ...(this.props.displayElements || {}),
      editJournal: get(this.props, 'displayElements.editJournal', true) && this.props.isAdmin && get(this.props, 'journalConfig.id')
    };
  }

  get isDocLibMode() {
    return isDocLib(this.state.viewMode);
  }

  get isPreviewMode() {
    return isPreview(this.state.viewMode);
  }

  get searchText() {
    const { isActivePage, urlParams } = this.props;
    return !isActivePage ? '' : get(getSearchParams(), JUP.SEARCH, get(urlParams, JUP.SEARCH, ''));
  }

  get titleHeader() {
    const { docLibFolderTitle, journalConfig } = this.props;
    return this.isDocLibMode ? docLibFolderTitle : get(journalConfig, 'meta.title', '');
  }

  get labelBtnMenu() {
    const { isMobile } = this.props;

    if (this.isDocLibMode) {
      return isMobile ? t(Labels.DL_SHOW_MENU_SM) : t(Labels.DL_SHOW_MENU);
    }

    return isMobile ? t(Labels.J_SHOW_MENU_SM) : t(Labels.J_SHOW_MENU);
  }

  setJournalRef = ref => {
    if (ref) {
      this._journalRef = ref;
    }
  };

  setJournalBodyRef = ref => {
    if (ref) {
      this._journalBodyRef = ref;
    }
  };

  setJournalBodyGroupRef = ref => {
    if (ref) {
      this._beforeJournalBlockRef = ref;
    }
  };

  setJournalFooterRef = ref => {
    if (ref) {
      this._journalFooterRef = ref;
    }
  };

  setJournalMenuRef = ref => {
    if (ref) {
      this._journalMenuRef = ref;
    }
  };

  setHeight = debounce(height => {
    this.setState({ height });
  }, 500);

  handleForceUpdate = debounce(() => {
    this.setState({ isForceUpdate: true }, () => this.setState({ isForceUpdate: false }));
  }, 250);

  handleAddRecord = createVariant => {
    const { isCreateLoading } = this.state;

    if (isCreateLoading) {
      return;
    }

    this.setState({ isCreateLoading: true });

    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => goToCardDetailsPage(record.id),
      onReady: () => this.setState({ isCreateLoading: false }),
      onAfterHideModal: () => this.setState({ isCreateLoading: false })
    });
  };

  handleSaveSettings = (id, settings) => {
    const { saveJournalSetting } = this.props;

    saveJournalSetting(id, settings);
  };

  handleCreateSettings = settings => {
    const {
      journalConfig: { id },
      createJournalSetting
    } = this.props;

    createJournalSetting(id, settings);
    this.handleToggleSettings();
  };

  handleApplySettings = (isChangedPredicates, settings) => {
    this.props.applySettings({ settings });
    if (isChangedPredicates) {
      const { clearSearch } = this.props;
      const url = removeUrlSearchParams(window.location.href, JUP.SEARCH);

      window.history.replaceState({ path: url }, '', url);
      clearSearch();
    }

    this.handleToggleSettings();
  };

  handleToggleSettings = () => {
    const { settingsVisible } = this.state;

    this.setState({ settingsVisible: !settingsVisible, savedSetting: null, isReset: false });
  };

  handleToggleViewMode = viewMode => {
    this.setState({ viewMode });
  };

  handleEditJournal = throttle(
    () => this.props.execJournalAction(`${SourcesId.JOURNAL}@${this.props.journalConfig.id}`, { type: ActionTypes.EDIT }),
    300,
    { leading: false, trailing: true }
  );

  handleToggleMenu = () => {
    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
    }

    this.setState({ menuOpenAnimate: !this.state.menuOpenAnimate });

    if (this.state.menuOpen) {
      animateScrollTo(this._journalRef, {
        scrollLeft: this._journalRef.scrollLeft - get(this, '_journalMenuRef.offsetWidth', 0)
      });
    }

    this._toggleMenuTimerId = window.setTimeout(
      () => {
        this.setState({ menuOpen: !this.state.menuOpen }, () => {
          if (this.props.isMobile) {
            return;
          }

          if (this.state.menuOpen) {
            animateScrollTo(
              this._journalRef,
              {
                scrollLeft: this._journalRef.scrollLeft + get(this, '_journalMenuRef.offsetWidth', 0)
              },
              500
            );
          }
        });
      },
      this.state.menuOpen ? 500 : 0
    );
  };

  handleSearch = text => {
    if (text === get(this.props, ['urlParams', JUP.SEARCH], '')) {
      return;
    }

    const searchParams = {
      ...getSearchParams(),
      search: text
    };
    this.props.setUrl(searchParams);
    this.props.runSearch(text);
  };

  handleResize = (w, h) => {
    const height = parseInt(h);

    if (!h || Number.isNaN(height) || height === this.state.height) {
      return;
    }

    this.setHeight(height);
  };

  handleSelectAllRecords = () => {
    const { setSelectAllRecords, selectAllRecords, setSelectedRecords } = this.props;

    setSelectAllRecords(!selectAllRecords);

    if (!selectAllRecords) {
      setSelectedRecords([]);
    }
  };

  handleExecuteGroupAction = action => {
    const { selectAllRecords } = this.props;

    if (!selectAllRecords) {
      const records = get(this.props, 'selectedRecords', []);

      this.props.execRecordsAction(records, action);
    } else {
      const query = get(this.props, 'grid.query');

      this.props.execRecordsAction(query, action);
    }
  };

  handleDisplayConfigPopup = event => {
    if (event.ctrlKey && event.shiftKey) {
      const { journalConfig } = this.props;
      event.stopPropagation();
      !!journalConfig && showModalJson(journalConfig, 'Journal Config');
    }
  };

  getJournalContentMaxHeight = () => {
    const { additionalHeights } = this.props;
    const journalMinHeight = 175;
    let height = document.body.offsetHeight;

    height -= get(document.querySelector('#alf-hd'), 'offsetHeight', 0);
    height -= get(document.querySelector('.page-tab'), 'offsetHeight', 0);

    if (this._beforeJournalBlockRef) {
      height -= get(this._beforeJournalBlockRef, 'offsetHeight', 0);
    }

    if (this._journalFooterRef) {
      height -= get(this._journalFooterRef, 'offsetHeight', 0);
      height -= 15; // for indent under pagination
    }

    if (this._journalBodyRef) {
      const styles = window.getComputedStyle(this._journalBodyRef, null);

      height -= parseInt(styles.getPropertyValue('padding-top'), 10) || 0;
      height -= parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    }

    height -= getScrollbarWidth();

    if (!Number.isNaN(additionalHeights)) {
      height += additionalHeights;
    }

    return height < journalMinHeight ? journalMinHeight : height;
  };

  InfoUnavailableView = React.memo(
    props => {
      const { isDocLibEnabled, isDocLibLoading } = props;
      const isDisplay = this.isDocLibMode && !isDocLibEnabled && !isDocLibLoading;

      if (isDisplay) {
        return (
          <div className="alert alert-secondary" role="alert">
            {t(Labels.UNAVAILABLE_VIEW)}
          </div>
        );
      }

      return null;
    },
    (prevProps, nextProps) =>
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.isDocLibLoading === nextProps.isDocLibLoading &&
      prevProps.isDocLibEnabled === nextProps.isDocLibEnabled
  );

  renderBreadcrumbs = () => {
    const { stateId } = this.props;

    if (this.isDocLibMode) {
      return <DocLibBreadcrumbs stateId={stateId} />;
    }
  };

  renderHeader = () => {
    if (this.displayElements.header) {
      const { menuOpen } = this.state;
      const { isMobile } = this.props;

      return (
        <div onClick={this.handleDisplayConfigPopup}>
          <JournalsHead
            title={this.titleHeader}
            labelBtnMenu={this.labelBtnMenu}
            isOpenMenu={menuOpen}
            isMobile={isMobile}
            hasBtnMenu={this.displayElements.menu}
            hasBtnEdit={this.displayElements.editJournal}
            onToggleMenu={this.handleToggleMenu}
            onEditJournal={this.handleEditJournal}
          />
        </div>
      );
    }
  };

  renderSettings = () => {
    if (!this.displayElements.settings) {
      return null;
    }

    const {
      settingsFiltersData,
      stateId,
      journalConfig,
      grid,
      isMobile,
      selectedRecords,
      reloadGrid,
      isDocLibEnabled,
      settingsData,
      settingsColumnsData,
      settingsGroupingData,
      isLoading
    } = this.props;
    const { settingsVisible, isReset, isCreateLoading, viewMode } = this.state;

    if (this.isDocLibMode) {
      return <DocLibSettingsBar stateId={stateId} isMobile={isMobile} onToggleViewMode={this.handleToggleViewMode} />;
    }

    return (
      <>
        <SettingsModal
          {...settingsData}
          filtersData={settingsFiltersData}
          columnsData={settingsColumnsData}
          groupingData={settingsGroupingData}
          isReset={isReset}
          isOpen={settingsVisible}
          onClose={this.handleToggleSettings}
          onApply={this.handleApplySettings}
          onCreate={this.handleCreateSettings}
          onSave={this.handleSaveSettings}
        />

        <JournalsSettingsBar
          stateId={stateId}
          grid={grid}
          journalConfig={journalConfig}
          searchText={this.searchText}
          selectedRecords={selectedRecords}
          viewMode={viewMode}
          isMobile={isMobile}
          isDocLibEnabled={isDocLibEnabled}
          isCreateLoading={isCreateLoading}
          isLoading={isLoading}
          onRefresh={reloadGrid}
          onSearch={this.handleSearch}
          onToggleSettings={this.handleToggleSettings}
          onToggleViewMode={this.handleToggleViewMode}
          onAddRecord={this.handleAddRecord}
        />
      </>
    );
  };

  renderGroupActions = () => {
    if (this.displayElements.groupActions) {
      const { stateId, grid, isMobile, selectedRecords, selectAllRecordsVisible, selectAllRecords } = this.props;

      if (this.isDocLibMode) {
        return <DocLibGroupActions isMobile={isMobile} stateId={stateId} />;
      }

      return (
        <JournalsGroupActionsTools
          isMobile={isMobile}
          selectAllRecordsVisible={selectAllRecordsVisible}
          selectAllRecords={selectAllRecords}
          grid={grid}
          selectedRecords={selectedRecords}
          onExecuteAction={this.handleExecuteGroupAction}
          onGoTo={this.onGoTo}
          onSelectAll={this.handleSelectAllRecords}
        />
      );
    }
  };

  renderContent = () => {
    const { stateId, isMobile, isActivePage } = this.props;

    if (this.isDocLibMode) {
      return <FilesViewer stateId={stateId} isMobile={isMobile} />;
    }

    return (
      <JournalsContent
        stateId={stateId}
        showPreview={this.isPreviewMode && !isMobile}
        maxHeight={this.getJournalContentMaxHeight()}
        isActivePage={isActivePage}
        onOpenSettings={this.handleToggleSettings}
      />
    );
  };

  renderPagination = () => {
    if (this.displayElements.pagination) {
      const { stateId, isMobile } = this.props;

      if (this.isDocLibMode) {
        return <DocLibPagination stateId={stateId} hasPageSize isMobile={isMobile} />;
      }

      return (
        <JournalsDashletPagination
          stateId={stateId}
          hasPageSize
          className={classNames('ecos-journal__pagination', { 'ecos-journal__pagination_mobile': isMobile })}
        />
      );
    }
  };

  renderMenu = () => {
    if (this.displayElements.menu) {
      const { stateId, pageTabsIsShow, isMobile, isActivePage } = this.props;
      const { menuOpen, menuOpenAnimate, height, viewMode } = this.state;

      return (
        <div
          className={classNames('ecos-journal__menu', {
            'ecos-journal__menu_with-tabs': pageTabsIsShow,
            'ecos-journal__menu_mobile': isMobile,
            'ecos-journal__menu_expanded': menuOpenAnimate,
            'ecos-journal__menu_expanded-document-library': menuOpenAnimate && this.isDocLibMode
          })}
        >
          <JournalsMenu
            height={height}
            forwardedRef={this.setJournalMenuRef}
            stateId={stateId}
            open={menuOpen}
            onClose={this.handleToggleMenu}
            isActivePage={isActivePage}
            viewMode={viewMode}
          />
        </div>
      );
    }
  };

  render() {
    const { journalConfig, pageTabsIsShow, isMobile, className, bodyClassName } = this.props;
    const { height, viewMode } = this.state;

    if (!journalConfig || !journalConfig.columns || !journalConfig.columns.length) {
      return null;
    }

    return (
      <ReactResizeDetector handleHeight onResize={this.handleResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', className, {
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= JOURNAL_MIN_HEIGHT
          })}
        >
          <div
            ref={this.setJournalBodyRef}
            className={classNames('ecos-journal__body', bodyClassName, {
              'ecos-journal__body_with-tabs': pageTabsIsShow,
              'ecos-journal__body_mobile': isMobile,
              'ecos-journal__body_with-preview': this.isPreviewMode
            })}
          >
            <div className="ecos-journal__body-group" ref={this.setJournalBodyGroupRef}>
              {this.renderBreadcrumbs()}
              {this.renderHeader()}
              {this.renderSettings()}
              {this.renderGroupActions()}
            </div>

            <this.InfoUnavailableView viewMode={viewMode} {...this.props} />
            {this.renderContent()}

            <div className="ecos-journal__footer" ref={this.setJournalFooterRef}>
              {this.renderPagination()}
            </div>
          </div>

          {this.renderMenu()}
        </div>
      </ReactResizeDetector>
    );
  }
}

Journals.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  additionalHeights: PropTypes.number,
  isActivePage: PropTypes.bool,
  displayElements: PropTypes.shape({
    menu: PropTypes.bool,
    header: PropTypes.bool,
    settings: PropTypes.bool,
    pagination: PropTypes.bool,
    groupActions: PropTypes.bool
  })
};

Journals.defaultProps = {
  className: '',
  bodyClassName: '',
  additionalHeights: 0,
  displayElements: { ...defaultDisplayElements }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
