import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';

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
import { JournalUrlParams } from '../../constants';
import { animateScrollTo, getBool, getScrollbarWidth, objectCompare, t } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams, goToCardDetailsPage, removeUrlSearchParams, updateCurrentUrl } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import FormManager from '../EcosForm/FormManager';

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
  _journalBodyRef = null;
  _beforeJournalBlockRef = null;
  _journalFooterRef = null;
  _journalMenuRef = null;
  _toggleMenuTimerId = null;

  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false,
      isReset: false,
      isForceUpdate: false,
      menuOpenAnimate: false,
      settingsVisible: false,
      savedSetting: null,
      showPreview: getBool(get(getSearchParams(), JournalUrlParams.SHOW_PREVIEW))
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};
    const journalId = get(props, ['urlParams', JournalUrlParams.JOURNAL_ID]);

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
    const { isActivePage: _isActivePage, urlParams: _urlParams } = prevProps;

    const _journalId = get(_urlParams, JournalUrlParams.JOURNAL_ID);
    const journalId = get(urlParams, JournalUrlParams.JOURNAL_ID);
    const showPreview = getBool(get(getSearchParams(), JournalUrlParams.SHOW_PREVIEW));

    const otherActiveJournal =
      isActivePage && ((_isActivePage && journalId && journalId !== _journalId) || this.state.journalId !== prevState.journalId);
    const someUrlChanges =
      isActivePage &&
      _isActivePage &&
      !equalsQueryUrls({ urls: [this.props._url, prevProps._url], ignored: [JournalUrlParams.SHOW_PREVIEW] });

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

    if (isActivePage && showPreview !== this.state.showPreview) {
      updateCurrentUrl({ showPreview: this.state.showPreview });
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

  onForceUpdate = debounce(() => {
    this.setState({ isForceUpdate: true }, () => this.setState({ isForceUpdate: false }));
  }, 250);

  getSearch = () => {
    const { isActivePage, urlParams } = this.props;

    if (!isActivePage) {
      return '';
    }

    return get(getSearchParams(), JournalUrlParams.SEARCH, get(urlParams, 'search', ''));
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

    this.setState({ savedSetting: { ...savedSetting, predicate }, isReset: true }, () => this.setState({ isReset: false }));
  };

  applySettings = () => {
    const url = removeUrlSearchParams(window.location.href, JournalUrlParams.SEARCH);

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
    this.setState(state => ({ showPreview: !state.showPreview }));
  };

  showGrid = () => {
    this.setState({ showPreview: false });
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
    if (text === get(this.props, 'urlParams.search', '')) {
      return;
    }

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

  getJournalContentMaxHeight = () => {
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

    const appFooter = document.querySelector('.app-footer');

    if (appFooter) {
      height -= get(appFooter, 'offsetHeight', 0);
    }

    if (this._journalBodyRef) {
      const styles = window.getComputedStyle(this._journalBodyRef, null);

      height -= parseInt(styles.getPropertyValue('padding-top'), 10) || 0;
      height -= parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    }

    height -= getScrollbarWidth();

    return height < journalMinHeight ? journalMinHeight : height;
  };

  render() {
    const {
      stateId,
      journalConfig,
      pageTabsIsShow,
      grid,
      isMobile,
      isActivePage,
      selectedRecords,
      selectAllRecordsVisible,
      selectAllRecords,
      reloadGrid
    } = this.props;
    const { menuOpen, menuOpenAnimate, settingsVisible, showPreview, height, isReset } = this.state;

    if (!journalConfig) {
      return null;
    }

    const { id: journalId, columns = [], meta = {}, sourceId } = journalConfig;

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
            ref={this.setJournalBodyRef}
            className={classNames('ecos-journal__body', {
              'ecos-journal__body_with-tabs': pageTabsIsShow,
              'ecos-journal__body_mobile': isMobile,
              'ecos-journal__body_with-preview': showPreview
            })}
          >
            <div className="ecos-journal__body-group" ref={this.setJournalBodyGroupRef}>
              <JournalsHead toggleMenu={this.toggleMenu} title={get(meta, 'title')} menuOpen={menuOpen} isMobile={isMobile} />

              <JournalsSettingsBar
                grid={grid}
                journalConfig={journalConfig}
                stateId={stateId}
                showPreview={showPreview}
                toggleSettings={this.toggleSettings}
                togglePreview={this.togglePreview}
                showGrid={this.showGrid}
                refresh={reloadGrid}
                onSearch={this.onSearch}
                addRecord={this.addRecord}
                isMobile={isMobile}
                searchText={this.getSearch()}
                selectedRecords={selectedRecords}
              />

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
            </div>

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
                      <JournalsFilters
                        stateId={stateId}
                        columns={visibleColumns}
                        sourceId={sourceId}
                        metaRecord={get(meta, 'metaRecord')}
                        needUpdate={isReset}
                      />
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

            <JournalsContent
              stateId={stateId}
              showPreview={showPreview && !isMobile}
              maxHeight={this.getJournalContentMaxHeight()}
              isActivePage={isActivePage}
            />

            <div className="ecos-journal__footer" ref={this.setJournalFooterRef}>
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
              height={height}
              forwardedRef={this.setJournalMenuRef}
              stateId={stateId}
              open={menuOpen}
              onClose={this.toggleMenu}
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
