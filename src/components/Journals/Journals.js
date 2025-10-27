import classNames from 'classnames';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import merge from 'lodash/merge';
import throttle from 'lodash/throttle';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';

import Records from '../Records';
import { ActionTypes } from '../Records/actions/constants';

import JournalsHead from './JournalsHead';
import JournalsMenu from './JournalsMenu';
import { DocLibView, KanbanView, PreviewListView, TableView } from './Views';
import {
  isDocLib,
  isUnknownView,
  JOURNAL_MIN_HEIGHT,
  JOURNAL_MIN_HEIGHT_MOB,
  PADDING_NEW_JOURNAL,
  JOURNAL_VIEW_MODE as JVM,
  Labels,
  isTable,
  isKanban,
  isKanbanOrDocLib,
  isPreview,
  isPreviewList
} from './constants';

import { getTypeRef } from '@/actions/docLib';
import { execJournalAction, fetchBreadcrumbs, setUrl, toggleViewMode } from '@/actions/journals';
import { getBoardList } from '@/actions/kanban';
import { updateTab } from '@/actions/pageTabs';
import JournalsPreviewWidgets from '@/components/Journals/JournalsPreviewWidgets/JournalsPreviewWidgets';
import { ResizeBoxes } from '@/components/common';
import { Well } from '@/components/common/form';
import { DocLibUrlParams as DLUP, JournalUrlParams as JUP, SourcesId } from '@/constants';
import { WidgetsKeys } from '@/constants/widgets';
import { pagesStore } from '@/helpers/indexedDB';
import { wrapArgs } from '@/helpers/redux';
import { showModalJson } from '@/helpers/tools';
import { equalsQueryUrls, getSearchParams, updateCurrentUrl } from '@/helpers/urls';
import { animateScrollTo, getBool, getCurrentUserName, t } from '@/helpers/util';
import { selectCommonJournalPageProps, selectWidgetsConfig } from '@/selectors/journals';
import { selectIsViewNewJournal } from '@/selectors/view';
import PageService, { PageTypes } from '@/services/PageService';
import pageTabList from '@/services/pageTabs/PageTabList';

import './style.scss';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const widgetsConfig = selectWidgetsConfig(state, props.stateId);
  const isViewNewJournal = selectIsViewNewJournal(state);
  const searchParams = getSearchParams();

  return {
    isAdmin: get(state, 'user.isAdmin'),
    isMobile: get(state, 'view.isMobile'),
    pageTabsIsShow: get(state, 'pageTabs.isShow'),
    _url: window.location.href,
    isViewNewJournal,
    searchParams,
    widgetsConfig,
    ...commonProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode, stateId: props.stateId }))),
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context }))),
    getTypeRef: journalId => dispatch(getTypeRef(w({ journalId }))),
    getBoardList: journalId => dispatch(getBoardList({ journalId, stateId: props.stateId })),
    fetchBreadcrumbs: () => dispatch(fetchBreadcrumbs(w())),
    updateTab: tab => dispatch(updateTab({ tab }))
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

const ViewLabels = {
  [JVM.TABLE]: Labels.Views.JOURNAL,
  [JVM.DOC_LIB]: Labels.Views.DOC_LIB,
  [JVM.KANBAN]: Labels.Views.KANBAN
};

class Journals extends React.Component {
  _journalRef = null;
  _journalBodyTopRef = null;
  _journalFooterRef = null;
  _journalMenuRef = null;
  _toggleMenuTimerId = null;

  constructor(props) {
    super(props);

    this.userName = getCurrentUserName();

    this.state = {
      menuOpen: isDocLib(get(props.searchParams, JUP.VIEW_MODE)),
      menuOpenAnimate: isDocLib(get(props.searchParams, JUP.VIEW_MODE)),
      journalId: undefined,
      maxHeightJournal: 0,
      recordId: null,
      initiatedWidgetsConfig: false,
      isDragging: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const journalId = get(props, ['urlParams', JUP.JOURNAL_ID]);
    let newState = {};

    if (!journalId || state.journalId) {
      return null;
    }

    if (props.isActivePage && journalId !== state.journalId) {
      newState = merge(newState, { journalId });
    }

    if (isEmpty(newState)) {
      return null;
    }

    return newState;
  }

  updateViewMode = viewMode => {
    this.props.toggleViewMode(viewMode);
    if (get(this.props, 'searchParams.journalId')) {
      updateCurrentUrl({ viewMode });
    }
  };

  componentDidMount() {
    let { searchParams } = this.props;
    let viewMode = searchParams.viewMode;

    if (isPreview(viewMode)) {
      viewMode = JVM.TABLE;
      searchParams.viewWidgets = 'true';
      searchParams.viewMode = viewMode;
      updateCurrentUrl({ viewWidgets: true });
    }

    this.props.fetchBreadcrumbs();

    if (isUnknownView(viewMode)) {
      viewMode = JVM.TABLE;
      searchParams.viewMode = viewMode;
    }

    this.updateViewMode(viewMode);

    if (!isEqual(searchParams, this.props.urlParams)) {
      this.props.setUrl(searchParams);
    }

    if (!this.state.initiatedWidgetsConfig) {
      pagesStore
        .get(searchParams.journalId)
        .then(indexedDBConfig => {
          this.setState({ indexedDBConfig: get(indexedDBConfig, this.userName, {}) });
        })
        .catch(e => {
          console.error(e);
        })
        .finally(() => this.setState({ initiatedWidgetsConfig: true }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { _url, isActivePage, stateId, viewMode, tabId, isViewNewJournal, widgetsConfig, isLoadingGrid, searchParams } = this.props;
    const { journalId, initiatedWidgetsConfig } = this.state;
    const prevSearchParams = prevProps.searchParams;

    const { isLeftPositionWidgets } = widgetsConfig || {};
    const prevIsLeftPositionWidgets = get(prevProps, 'widgetsConfig.isLeftPositionWidgets');

    if (journalId && !isEqual(get(searchParams, 'recordRef'), get(prevSearchParams, 'recordRef'))) {
      this.props.fetchBreadcrumbs();
    }

    if (
      initiatedWidgetsConfig &&
      isBoolean(isLeftPositionWidgets) &&
      isBoolean(prevIsLeftPositionWidgets) &&
      prevIsLeftPositionWidgets !== isLeftPositionWidgets
    ) {
      this.swapContentSizesBox();
    }

    if (isLoadingGrid && !prevProps.isLoadingGrid) {
      this.setState({ recordId: null });
    }

    if (
      get(prevProps, ['urlParams', JUP.VIEW_WIDGET_PREVIEW]) !== get(this.props, ['urlParams', JUP.VIEW_WIDGET_PREVIEW]) ||
      !isEqual(prevProps.widgetsConfig, widgetsConfig)
    ) {
      this.setState({ recordId: null });
    }

    if (isViewNewJournal && prevProps.viewMode !== viewMode && (isTable(viewMode) || isKanban(viewMode) || isPreviewList(viewMode))) {
      this.setState({ menuOpen: false });
    }

    if (!isEqual(prevProps.viewMode, viewMode) && isDocLib(viewMode)) {
      this.setState({
        menuOpen: true,
        menuOpenAnimate: true
      });
    }

    const isEqualView = equalsQueryUrls({
      urls: [_url, prevProps._url],
      compareBy: [JUP.VIEW_MODE]
    });

    if (!isEqualView && viewMode && prevProps.viewMode === viewMode) {
      this.componentDidMount();
      return;
    }

    if (journalId && journalId !== prevState.journalId) {
      this.props.getTypeRef(journalId);
      this.props.getBoardList(journalId);
    }

    const isEqualQuery = equalsQueryUrls({
      urls: [_url, prevProps._url],
      ignored: [JUP.SHOW_PREVIEW, JUP.VIEW_MODE, DLUP.FOLDER_ID, DLUP.SEARCH]
    });

    const isActiveChanged = journalId && isActivePage && prevProps.isActivePage && !isEqualQuery;

    if (isActiveChanged || prevProps.stateId !== stateId) {
      this.props.setUrl(searchParams);
    }

    if (tabId && journalId && journalId !== prevState.journalId) {
      this.mountJournalUpdateWatcher();
    }
  }

  componentWillUnmount() {
    this.setHeight.cancel();
    this.handleEditJournal.cancel();

    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
      this._toggleMenuTimerId = null;
    }

    this.unmountJournalUpdateWatcher();
  }

  swapContentSizesBox = () => {
    const { indexedDBConfig } = this.state;

    const { widgetsConfig: { boxSizes } = {} } = indexedDBConfig || {};
    const { left: right, right: left } = boxSizes || {};

    if (!right || !left) {
      return;
    }

    this.onResizeWidgets({ left, right }).then(() =>
      this.setState({
        indexedDBConfig: {
          ...indexedDBConfig,
          widgetsConfig: {
            ...get(indexedDBConfig, 'widgetsConfig', {}),
            boxSizes: {
              left,
              right
            }
          }
        }
      })
    );
  };

  mountJournalUpdateWatcher() {
    this.journalRecord.watch(['_modified'], this.handleUpdateJournal);
  }

  unmountJournalUpdateWatcher() {
    this.props.tabId && this.journalRecord.unwatch(['_modified']);
  }

  get journalRecord() {
    return Records.get(`${SourcesId.JOURNAL}@${this.state.journalId}`);
  }

  get minHeight() {
    return this.props.isMobile ? JOURNAL_MIN_HEIGHT_MOB : JOURNAL_MIN_HEIGHT;
  }

  get draggableEventsProps() {
    const { widgetsConfig } = this.props;
    const { isDragging } = this.state;

    const { widgets } = widgetsConfig || {};
    const isDraggable = !!get(widgets, 0, []).find(widget => widget.name === WidgetsKeys.HIERARCHICAL_TREE);

    return {
      isDragging,
      draggable: isDraggable,
      onDragStart: this.onDragStartRowElement,
      onDragEnd: this.onDragEndRowElement
    };
  }

  getDisplayElements = () => {
    return {
      ...defaultDisplayElements,
      ...(this.props.displayElements || {}),
      editJournal: get(this.props, 'displayElements.editJournal', true) && this.props.isAdmin
    };
  };

  getCommonProps = () => {
    const { bodyClassName, stateId, isActivePage, pageTabsIsShow, isMobile, withForceUpdate, searchParams } = this.props;
    const { journalId, recordId } = this.state;
    const displayElements = this.getDisplayElements();
    const showWidgets = getBool(get(searchParams, JUP.VIEW_WIDGET_PREVIEW));

    return {
      stateId,
      journalId,
      isActivePage,
      withForceUpdate,
      showWidgets,
      selectedRecordId: recordId,
      onRowClick: this.onRowClick,
      onEditJournal: configRec => this.handleEditJournal(configRec),
      hasBtnEdit: configRec => displayElements.editJournal && !!configRec,
      hasBtnMenu: displayElements.menu,
      onToggleMenu: this.handleToggleMenu,
      Header: this.Header,
      UnavailableView: this.UnavailableView,
      displayElements: this.getDisplayElements(),
      minHeight: this.minHeight,
      getMaxHeight: this.getJournalContentMaxHeight,
      bodyTopForwardedRef: this.setJournalBodyTopRef,
      footerForwardedRef: this.setJournalFooterRef,
      draggableEvents: this.draggableEventsProps,
      bodyClassName: classNames('ecos-journal__body', bodyClassName, {
        'ecos-journal__body_with-tabs': pageTabsIsShow,
        'ecos-journal__body_mobile': isMobile
      })
    };
  };

  onDragStartRowElement = (e, id = '') => {
    const searchParams = new URLSearchParams('?' + id.includes('http') && id.includes('recordRef=') ? id.split('?')[1] : `recordRef=${id}`);
    const recordRef = searchParams.get('recordRef');
    this.setState({ isDragging: true }, () => recordRef && e.dataTransfer.setData('text/plain', recordRef));
  };

  onDragEndRowElement = () => {
    this.setState({ isDragging: false });
  };

  getJournalContentMaxHeight = () => {
    let headH = (this._journalBodyTopRef && get(this._journalBodyTopRef.getBoundingClientRect(), 'bottom')) || 0;
    const jFooterH = (this._journalFooterRef && get(this._journalFooterRef, 'offsetHeight')) || 0;
    const footerH = get(document.querySelector('.app-footer'), 'offsetHeight') || 0;
    const scrollHeight = get(document.querySelector('.ecos-kanban__scroll_h'), 'offsetHeight') || 0;
    const height = document.documentElement.clientHeight - headH - jFooterH - footerH - scrollHeight;

    const maxHeightJournal = Math.max(height, this.minHeight) - PADDING_NEW_JOURNAL;

    // When switching between tabs, the table elements disappear, which is why the maxHeight changes.
    // Therefore, we remember the last correct maxHeight in the state.
    if (headH) {
      if (maxHeightJournal !== this.state.maxHeightJournal) {
        this.setState({ maxHeightJournal });
      }

      return maxHeightJournal;
    }

    // The first state may be incorrect when initializing the table.
    return this.state.maxHeightJournal || maxHeightJournal;
  };

  setJournalRef = ref => !!ref && (this._journalRef = ref);

  setJournalBodyTopRef = ref => !!ref && (this._journalBodyTopRef = ref);

  setJournalFooterRef = ref => !!ref && (this._journalFooterRef = ref);

  setJournalMenuRef = ref => !!ref && (this._journalMenuRef = ref);

  setHeight = debounce(height => this.setState({ height }), 500);

  handleUpdateJournal = () => {
    const getTitle = get(PageService, ['pageTypes', PageTypes.JOURNALS, 'getTitle']);

    if (!getTitle) {
      return;
    }

    const { updateTab, tabId } = this.props;
    const { journalId } = this.state;

    getTitle({ journalId, force: true }).then(title => {
      const tab = pageTabList.getTabById(tabId);

      if (!tab) {
        return;
      }

      updateTab({ ...tab, title });
    });
  };

  handleEditJournal = throttle(configRec => this.props.execJournalAction(configRec, { type: ActionTypes.EDIT }), 300, {
    leading: false,
    trailing: true
  });

  handleToggleMenu = () => {
    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
    }

    this.setState(({ menuOpenAnimate }) => ({ menuOpenAnimate: !menuOpenAnimate }));

    if (this.state.menuOpen) {
      const scrollLeft = this._journalRef.scrollLeft - get(this, '_journalMenuRef.offsetWidth', 0);
      animateScrollTo(this._journalRef, { scrollLeft });
    }

    this._toggleMenuTimerId = window.setTimeout(
      () =>
        this.setState(
          ({ menuOpen }) => ({ menuOpen: !menuOpen }),
          () => {
            if (this.props.isMobile) {
              return;
            }

            if (this.state.menuOpen) {
              const scrollLeft = this._journalRef.scrollLeft + get(this, '_journalMenuRef.offsetWidth', 0);
              animateScrollTo(this._journalRef, { scrollLeft }, 500);
            }
          }
        ),
      this.state.menuOpen ? 500 : 0
    );
  };

  handleResize = (w, h) => {
    const height = parseInt(h);

    if (!h || Number.isNaN(height) || height === this.state.height) {
      return;
    }

    this.setHeight(height);
  };

  handleDisplayConfigPopup = (event, props) => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      event.stopPropagation();

      const { config } = props;

      !!config && showModalJson(config, 'Config');
    }
  };

  Header = props => {
    const displayElements = this.getDisplayElements();

    if (displayElements.header) {
      const { menuOpen } = this.state;
      const { isMobile } = this.props;

      return (
        <JournalsHead
          title={props.title}
          labelBtnMenu={props.labelBtnMenu || (isMobile ? t(Labels.Journal.SHOW_MENU_SM) : t(Labels.Journal.SHOW_MENU))}
          isOpenMenu={menuOpen}
          isMobile={isMobile}
          hasBtnMenu={displayElements.menu}
          hasBtnEdit={displayElements.editJournal && !!props.configRec}
          onToggleMenu={this.handleToggleMenu}
          onEditJournal={() => this.handleEditJournal(props.configRec)}
          onClick={e => this.handleDisplayConfigPopup(e, props)}
        />
      );
    }

    return <React.Fragment />;
  };

  RightMenu = () => {
    const displayElements = this.getDisplayElements();

    if (displayElements.menu) {
      const { stateId, isActivePage } = this.props;
      const { menuOpen, menuOpenAnimate, height } = this.state;

      return (
        <JournalsMenu
          height={height}
          stateId={stateId}
          isActivePage={isActivePage}
          open={menuOpen}
          menuOpenAnimate={menuOpenAnimate}
          forwardedRef={this.setJournalMenuRef}
          onClose={this.handleToggleMenu}
        />
      );
    }

    return <React.Fragment />;
  };

  UnavailableView = () => {
    const { viewMode } = this.props;
    const name = t(ViewLabels[viewMode]);

    return (
      <div className="alert alert-secondary" role="alert">
        {t('journal.page.unavailable-view', { name })}
      </div>
    );
  };

  onRowClick = row => {
    if (get(row, 'id') === this.state.recordId) {
      this.setState({ recordId: null });
      return;
    }

    this.setState({ recordId: get(row, 'id', null) });
  };

  renderViews = () => {
    const commonProps = this.getCommonProps();
    return (
      <>
        <TableView {...commonProps} />
        <DocLibView {...commonProps} />
        <KanbanView {...commonProps} />
        <PreviewListView {...commonProps} />
        <this.RightMenu />
      </>
    );
  };

  onResizeWidgets = async ({ left, right }) => {
    const { journalId } = this.state;

    if (!journalId) {
      return;
    }

    try {
      let dbValue = (await pagesStore.get(journalId)) || {
        pageId: journalId,
        [this.userName]: {
          widgetsConfig: {},
          settings: {},
          columns: {}
        }
      };

      dbValue[this.userName] = {
        ...dbValue[this.userName],
        widgetsConfig: {
          boxSizes: {
            left,
            right
          }
        }
      };

      await pagesStore.put(dbValue);
    } catch (e) {
      console.error(e);
    }
  };

  renderWithWidgets = () => {
    const { isViewNewJournal, widgetsConfig, stateId } = this.props;
    const { isLeftPositionWidgets } = widgetsConfig || {};
    const { recordId, indexedDBConfig } = this.state;
    const { widgetsConfig: { boxSizes = {} } = {} } = indexedDBConfig || {};

    const wellClassNames = 'ecos-well_full ecos-journals-content__preview-well';
    const draggableEvents = this.draggableEventsProps;

    if (isLeftPositionWidgets) {
      const leftId = `_${stateId}-preview-left`;
      const rightId = `_${stateId}-grid-right`;

      return (
        <div className="ecos-journals-content__sides">
          <div id={leftId} className="ecos-journals-content__sides-small">
            <Well isViewNewJournal={isViewNewJournal} className={wellClassNames}>
              <JournalsPreviewWidgets stateId={stateId} recordId={recordId} isDraggingRow={draggableEvents.isDragging} />
            </Well>
            <ResizeBoxes sizes={boxSizes} onResizeComplete={this.onResizeWidgets} leftId={leftId} rightId={rightId} isSimpleVertical />
          </div>
          <div id={rightId} className="ecos-journals-content__sides-large">
            {this.renderViews()}
          </div>
        </div>
      );
    }

    const leftId = `_${stateId}-grid-left`;
    const rightId = `_${stateId}-preview-right`;

    return (
      <div className="ecos-journals-content__sides">
        <div id={leftId} className="ecos-journals-content__sides-large">
          {this.renderViews()}
        </div>
        <div id={rightId} className="ecos-journals-content__sides-small">
          <ResizeBoxes
            sizes={boxSizes}
            onResizeComplete={this.onResizeWidgets}
            leftId={leftId}
            rightId={rightId}
            autoRightSide
            isSimpleVertical
          />
          <Well isViewNewJournal={isViewNewJournal} className={wellClassNames}>
            <JournalsPreviewWidgets stateId={stateId} recordId={recordId} isDraggingRow={draggableEvents.isDragging} />
          </Well>
        </div>
      </div>
    );
  };

  render() {
    const { isMobile, className, isViewNewJournal, viewMode } = this.props;
    const { height, initiatedWidgetsConfig } = this.state;
    const commonProps = this.getCommonProps();
    const { showWidgets } = commonProps || {};

    return (
      <ReactResizeDetector handleHeight={!isViewNewJournal} onResize={this.handleResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', className, {
            'ecos-journal_new': isViewNewJournal,
            'ecos-journal_new__not-mobile': !isMobile,
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= commonProps.minHeight
          })}
        >
          {showWidgets && !isKanbanOrDocLib(viewMode) && !isMobile && initiatedWidgetsConfig
            ? this.renderWithWidgets()
            : this.renderViews()}
        </div>
      </ReactResizeDetector>
    );
  }
}

Journals.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  title: PropTypes.string,
  additionalHeights: PropTypes.number,
  isViewNewJournal: PropTypes.bool,
  widgetsConfig: PropTypes.shape({
    isLeftPositionWidgets: PropTypes.bool,
    widgets: PropTypes.array
  }),
  isActivePage: PropTypes.bool,
  displayElements: PropTypes.shape({
    menu: PropTypes.bool,
    header: PropTypes.bool,
    settings: PropTypes.bool,
    pagination: PropTypes.bool,
    groupActions: PropTypes.bool
  }),
  withForceUpdate: PropTypes.bool,
  tabId: PropTypes.string
};

Journals.defaultProps = {
  title: '',
  className: '',
  bodyClassName: '',
  additionalHeights: 0,
  displayElements: { ...defaultDisplayElements }
};

export default connect(mapStateToProps, mapDispatchToProps)(Journals);
