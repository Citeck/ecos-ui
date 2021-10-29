import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import EcosModal from '../common/EcosModal/EcosModal';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import { Well } from '../common/form';
import { deselectAllRecords, getJournalsData, reloadGrid, restoreJournalSettingData, runSearch, setUrl } from '../../actions/journals';
import { JournalUrlParams } from '../../constants';
import { animateScrollTo, getBool, objectCompare, t } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams, goToCardDetailsPage, removeUrlSearchParams, updateCurrentUrl } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import FormManager from '../EcosForm/FormManager';

import { JOURNAL_MIN_HEIGHT, JOURNAL_MIN_HEIGHT_MOB } from './constants';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import JournalsSettingsBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';

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
    isLoading: newState.loading,
    urlParams: newState.url,
    _url: window.location.href
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    deselectAllRecords: () => dispatch(deselectAllRecords(w())),
    runSearch: text => dispatch(runSearch({ text, stateId: props.stateId })),
    restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting))),
    setUrl: urlParams => dispatch(setUrl(w(urlParams)))
  };
};

class Journals extends Component {
  _journalRef = null;
  _journalBodyTopRef = null;
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
      createIsLoading: false,
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
    const { urlParams, stateId, isActivePage, isLoading, getJournalsData, setUrl } = this.props;
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
      this.handleReloadJournal();
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

  setJournalRef = ref => !!ref && (this._journalRef = ref);

  setJournalBodyTopRef = ref => !!ref && (this._journalBodyTopRef = ref);

  setJournalFooterRef = ref => !!ref && (this._journalFooterRef = ref);

  setJournalMenuRef = ref => !!ref && (this._journalMenuRef = ref);

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
    const { createIsLoading } = this.state;

    if (createIsLoading) {
      return;
    }

    this.setState({ createIsLoading: true });

    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      },
      onReady: () => {
        this.setState({ createIsLoading: false });
      },
      onAfterHideModal: () => {
        this.setState({ createIsLoading: false });
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

  setHeight = debounce(height => this.setState({ height }), 500);

  getJournalContentMaxHeight = () => {
    const min = this.props.isMobile ? JOURNAL_MIN_HEIGHT_MOB : JOURNAL_MIN_HEIGHT;
    const headH = (this._journalBodyTopRef && get(this._journalBodyTopRef.getBoundingClientRect(), 'bottom')) || 0;
    const jFooterH = (this._journalFooterRef && get(this._journalFooterRef, 'offsetHeight')) || 0;
    const footerH = get(document.querySelector('.app-footer'), 'offsetHeight') || 0;
    const height = document.documentElement.clientHeight - headH - jFooterH - footerH;

    return height < min ? min : height;
  };

  handleReloadJournal = () => {
    this.props.deselectAllRecords();
    this.props.reloadGrid();
  };

  render() {
    const { stateId, journalConfig, pageTabsIsShow, grid, isMobile, isActivePage, selectedRecords } = this.props;
    const { menuOpen, menuOpenAnimate, settingsVisible, showPreview, height, isReset, createIsLoading } = this.state;

    if (!journalConfig) {
      return null;
    }

    const { id: journalId, columns = [], meta = {}, sourceId } = journalConfig;

    if (!columns.length) {
      return null;
    }

    const visibleColumns = columns.filter(c => c.visible);
    const minH = isMobile ? JOURNAL_MIN_HEIGHT_MOB : JOURNAL_MIN_HEIGHT;

    return (
      <ReactResizeDetector handleHeight onResize={this.onResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', {
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= minH
          })}
        >
          <div
            className={classNames('ecos-journal__body', {
              'ecos-journal__body_with-tabs': pageTabsIsShow,
              'ecos-journal__body_mobile': isMobile,
              'ecos-journal__body_with-preview': showPreview
            })}
          >
            <div className="ecos-journal__body-group" ref={this.setJournalBodyTopRef}>
              <JournalsHead toggleMenu={this.toggleMenu} title={get(meta, 'title')} menuOpen={menuOpen} isMobile={isMobile} />

              <JournalsSettingsBar
                grid={grid}
                journalConfig={journalConfig}
                stateId={stateId}
                showPreview={showPreview}
                onToggleSettings={this.toggleSettings}
                togglePreview={this.togglePreview}
                showGrid={this.showGrid}
                onRefresh={this.handleReloadJournal}
                onSearch={this.onSearch}
                onAddRecord={this.addRecord}
                isMobile={isMobile}
                searchText={this.getSearch()}
                selectedRecords={selectedRecords}
                createIsLoading={createIsLoading}
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
              minHeight={minH}
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
