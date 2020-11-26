import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';

import FormManager from '../EcosForm/FormManager';
import EcosModal from '../common/EcosModal/EcosModal';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import { Well } from '../common/form';
import {
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  restoreJournalSettingData,
  runSearch,
  setSelectAllRecords,
  setSelectedRecords,
  setUrl
} from '../../actions/journals';
import { animateScrollTo, getScrollbarWidth, objectCompare, t } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams, goToCardDetailsPage, removeUrlSearchParams } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';

import { JOURNAL_MIN_HEIGHT } from './constants';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import JournalsSettingsBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';
import { JournalsGroupActionsTools } from './JournalsTools';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow,
    journalConfig: newState.journalConfig,
    journalSetting: newState.journalSetting,
    predicate: newState.predicate,
    gridPredicates: get(newState, 'grid.predicates', []),
    grid: newState.grid,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible,
    isLoading: newState.loading,
    urlParams: newState.url,
    _url: window.location.href
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting))),
    setUrl: urlParams => dispatch(setUrl(w(urlParams)))
  };
};

class Journals extends Component {
  _journalRef = null;
  _journalMenuRef = null;
  _toggleMenuTimerId = null;

  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false,
      isReset: false,
      menuOpenAnimate: false,
      settingsVisible: false,
      showPreview: get(props, 'urlParams.showPreview'),
      showPie: false,
      savedSetting: null,
      journalId: get(props, 'urlParams.journalId'),
      isForceUpdate: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};
    const journalId = get(props, 'urlParams.journalId');

    if (props.isActivePage && journalId !== state.journalId) {
      newState.journalId = journalId;
    }

    if (
      !state.isReset &&
      state.settingsVisible &&
      state.savedSetting &&
      !objectCompare(props.predicate, get(state, 'savedSetting.predicate', {}))
    ) {
      newState.savedSetting = {
        ...state.savedSetting,
        predicate: props.predicate
      };
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  componentDidMount() {
    this.props.setUrl(getSearchParams());
  }

  componentDidUpdate(prevProps, prevState) {
    const { urlParams, stateId, isActivePage, isLoading, getJournalsData, reloadGrid, setUrl } = this.props;

    const { isActivePage: _isActivePage } = prevProps;
    const _journalId = get(prevProps, 'urlParams.journalId');
    const journalId = get(urlParams, 'journalId');
    const someUrlChanges = isActivePage && !equalsQueryUrls({ urls: [this.props._url, prevProps._url] });
    const otherActiveJournal =
      isActivePage && ((_isActivePage && journalId && journalId !== _journalId) || this.state.journalId !== prevState.journalId);

    if (someUrlChanges) {
      setUrl(getSearchParams());
    }

    if (someUrlChanges || otherActiveJournal || prevProps.stateId !== stateId) {
      getJournalsData();
    }

    if (isActivePage && this.state.isForceUpdate) {
      this.setState({ isForceUpdate: false });
      reloadGrid();
    }

    if (_isActivePage && !isActivePage && isLoading) {
      this.setState({ isForceUpdate: true });
    }
  }

  componentWillUnmount() {
    this.onForceUpdate.cancel();
    this.setHeight.cancel();

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

  setJournalRef = ref => {
    if (ref) {
      this._journalRef = ref;
    }
  };

  setJournalMenuRef = ref => {
    if (ref) {
      this._journalMenuRef = ref;
    }
  };

  onForceUpdate = debounce(() => {
    this.setState({ isForceUpdate: true }, () => this.setState({ isForceUpdate: false }));
  }, 250);

  getSearch = () => {
    return this.props.isActivePage ? get(getSearchParams(), 'search', '') : '';
  };

  getAvailableHeight = (height = this.state.height || 0) => {
    if (!height) {
      return 0;
    }

    return height > JOURNAL_MIN_HEIGHT ? height : JOURNAL_MIN_HEIGHT;
  };

  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  resetSettings = savedSetting => {
    const { predicate } = this.props;

    this.setState({ savedSetting: { ...savedSetting, predicate }, isReset: true });
  };

  applySettings = () => {
    const url = removeUrlSearchParams(window.location.href, 'search');

    window.history.replaceState({ path: url }, '', url);
    this.toggleSettings();
  };

  toggleSettings = (isCancel = false) => {
    const { gridPredicates, journalSetting } = this.props;
    const { savedSetting, settingsVisible, isReset } = this.state;

    if (savedSetting && settingsVisible) {
      this.props.restoreJournalSettingData({ ...savedSetting, predicate: get(savedSetting, 'predicate', {}), isReset });
    }

    if (!savedSetting && settingsVisible && isCancel) {
      this.props.restoreJournalSettingData({ ...journalSetting, predicate: get(gridPredicates, ['0'], {}) });
    }

    this.setState({ settingsVisible: !settingsVisible, savedSetting: null, isReset: false });
  };

  togglePreview = () => {
    this.setState(state => ({ showPreview: !state.showPreview, showPie: false }));
  };

  togglePie = () => {
    this.setState(state => ({ showPreview: false, showPie: !state.showPie }));
  };

  showGrid = () => {
    this.setState({ showPreview: false, showPie: false });
  };

  toggleMenu = () => {
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

  onSearch = text => {
    const searchParams = {
      ...getSearchParams(),
      search: text
    };

    this.props.setUrl(searchParams);
    this.props.runSearch(text);
  };

  onResize = (w, h) => {
    const height = parseInt(h);

    if (!h || Number.isNaN(height) || height === this.state.height) {
      return;
    }

    this.setHeight(height);
  };

  setHeight = debounce(height => {
    this.setState({ height });
  }, 500);

  onSelectAllRecords = () => {
    const { setSelectAllRecords, selectAllRecords, setSelectedRecords } = this.props;

    setSelectAllRecords(!selectAllRecords);

    if (!selectAllRecords) {
      setSelectedRecords([]);
    }
  };

  onExecuteGroupAction(action) {
    const { selectAllRecords } = this.props;

    if (!selectAllRecords) {
      const records = get(this.props, 'selectedRecords', []);

      this.props.execRecordsAction(records, action);
    } else {
      const query = get(this.props, 'grid.query');

      this.props.execRecordsAction(query, action);
    }
  }

  render() {
    const {
      stateId,
      journalConfig,
      pageTabsIsShow,
      grid,
      isMobile,
      isActivePage,
      isLoading,
      selectedRecords,
      selectAllRecordsVisible,
      selectAllRecords,
      reloadGrid
    } = this.props;
    const { menuOpen, menuOpenAnimate, settingsVisible, showPreview, showPie, height } = this.state;

    if (!journalConfig) {
      return null;
    }

    const {
      id: journalId,
      columns = [],
      meta: { title = '', metaRecord },
      sourceId
    } = journalConfig;

    if (!columns.length) {
      return null;
    }

    const visibleColumns = columns.filter(c => c.visible);

    return (
      <ReactResizeDetector handleHeight onResize={this.onResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', {
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= JOURNAL_MIN_HEIGHT
          })}
        >
          <div
            className={classNames('ecos-journal__body', {
              'ecos-journal__body_with-tabs': pageTabsIsShow,
              'ecos-journal__body_mobile': isMobile,
              'ecos-journal__body_with-preview': showPreview
            })}
          >
            <JournalsHead isLoading={isLoading} toggleMenu={this.toggleMenu} title={title} menuOpen={menuOpen} isMobile={isMobile} />

            <JournalsSettingsBar
              grid={grid}
              journalConfig={journalConfig}
              stateId={stateId}
              showPreview={showPreview}
              showPie={showPie}
              toggleSettings={this.toggleSettings}
              togglePreview={this.togglePreview}
              togglePie={this.togglePie}
              showGrid={this.showGrid}
              refresh={reloadGrid}
              onSearch={this.onSearch}
              addRecord={this.addRecord}
              isMobile={isMobile}
              searchText={this.getSearch()}
              selectedRecords={selectedRecords}
            />

            <EcosModal
              title={t('journals.action.setting-dialog-msg')}
              isOpen={settingsVisible}
              hideModal={() => this.toggleSettings(true)}
              isBigHeader
              className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
            >
              <Well className="ecos-journal__settings">
                <EcosModalHeight>
                  {height => (
                    <Scrollbars style={{ height }}>
                      <JournalsFilters stateId={stateId} columns={visibleColumns} sourceId={sourceId} metaRecord={metaRecord} />
                      <JournalsColumnsSetup stateId={stateId} columns={visibleColumns} />
                      <JournalsGrouping stateId={stateId} columns={visibleColumns} />
                    </Scrollbars>
                  )}
                </EcosModalHeight>

                <JournalsSettingsFooter
                  parentClass="ecos-journal__settings"
                  stateId={stateId}
                  journalId={journalId}
                  onApply={this.applySettings}
                  onCreate={this.toggleSettings}
                  onReset={this.resetSettings}
                />
              </Well>
            </EcosModal>

            <JournalsGroupActionsTools
              isMobile={isMobile}
              selectAllRecordsVisible={selectAllRecordsVisible}
              selectAllRecords={selectAllRecords}
              grid={grid}
              selectedRecords={selectedRecords}
              onExecuteAction={this.onExecuteGroupAction.bind(this)}
              onGoTo={this.onGoTo}
              onSelectAll={this.onSelectAllRecords}
            />

            <JournalsContent
              stateId={stateId}
              showPreview={showPreview && !isMobile}
              showPie={showPie}
              maxHeight={this.getAvailableHeight() - (165 + (this.isOpenGroupActions ? 60 : 0))}
              isActivePage={isActivePage}
            />

            <div className={'ecos-journal__footer'}>
              <JournalsDashletPagination
                stateId={stateId}
                hasPageSize
                className={classNames('ecos-journal__pagination', {
                  'ecos-journal__pagination_mobile': isMobile
                })}
              />
            </div>
          </div>

          <div
            className={classNames('ecos-journal__menu', {
              'ecos-journal__menu_with-tabs': pageTabsIsShow,
              'ecos-journal__menu_mobile': isMobile,
              'ecos-journal__menu_expanded': menuOpenAnimate
            })}
          >
            <JournalsMenu
              forwardedRef={this.setJournalMenuRef}
              stateId={stateId}
              open={menuOpen}
              onClose={this.toggleMenu}
              height={this.getAvailableHeight() - getScrollbarWidth()}
              isActivePage={isActivePage}
            />
          </div>
        </div>
      </ReactResizeDetector>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
