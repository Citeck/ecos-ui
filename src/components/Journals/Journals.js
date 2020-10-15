import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

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

import FormManager from '../EcosForm/FormManager';
import EcosModal from '../common/EcosModal/EcosModal';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import { Well } from '../common/form';
import {
  execRecordsAction,
  getJournalsData,
  reloadGrid,
  restoreJournalSettingData,
  search,
  setSelectAllRecords,
  setSelectedRecords
} from '../../actions/journals';
import { animateScrollTo, getScrollbarWidth, objectCompare, t, trigger } from '../../helpers/util';
import { getSearchParams, goToCardDetailsPage, stringifySearchParams } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow,
    journalConfig: newState.journalConfig,
    predicate: newState.predicate,
    grid: newState.grid,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible,
    isLoading: newState.loading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    search: text => dispatch(search({ text, stateId: props.stateId })),
    restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting)))
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
      menuOpenAnimate: false,
      settingsVisible: false,
      showPreview: props.urlParams.showPreview,
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

    if (state.settingsVisible && state.savedSetting && !objectCompare(props.predicate, get(state, 'savedSetting.predicate', {}))) {
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
    trigger.call(this, 'getJournalsData');
    trigger.call(this, 'onRender');
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      isActivePage,
      urlParams: { journalId },
      stateId,
      grid,
      isLoading,
      getJournalsData
    } = this.props;
    const {
      isActivePage: _isActivePage,
      urlParams: { journalId: _journalId }
    } = prevProps;
    const search = this.getSearch();

    if (isActivePage && ((_isActivePage && journalId && journalId !== _journalId) || this.state.journalId !== prevState.journalId)) {
      getJournalsData();
    }

    if (prevProps.stateId !== stateId) {
      getJournalsData();
    }

    if (search !== get(grid, 'search')) {
      this.onSearch(search);
    }

    if (isActivePage && this.state.isForceUpdate) {
      this.setState({ isForceUpdate: false });
      this.props.reloadGrid();
    }

    if (_isActivePage && !isActivePage && isLoading) {
      this.setState({ isForceUpdate: true });
    }
  }

  componentWillUnmount() {
    this.onForceUpdate.cancel();
    this.onResize.cancel();

    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
      this._toggleMenuTimerId = null;
    }
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

  addRecord = createVariant => {
    FormManager.createRecordByVariant(createVariant, {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  resetSettings = savedSetting => {
    this.setState({ savedSetting });
  };

  toggleSettings = () => {
    const { savedSetting, settingsVisible } = this.state;

    if (savedSetting && settingsVisible) {
      this.props.restoreJournalSettingData(savedSetting);
    }

    this.setState({ settingsVisible: !settingsVisible, savedSetting: null });
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

    this.props.setUrl(getSearchParams(stringifySearchParams(searchParams)));
    this.props.search(text);
  };

  onResize = debounce((w, h) => {
    const height = parseInt(h);

    if (!h || Number.isNaN(height) || height === this.state.height) {
      return;
    }

    this.setState({ height });
  }, 250);

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
    const minH = 300;
    const availableHeight = height => (height && height > minH ? height : minH);

    return (
      <ReactResizeDetector handleHeight onResize={this.onResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', { 'ecos-journal_mobile': isMobile, 'ecos-journal_scroll': height <= minH })}
        >
          <div
            className={classNames('ecos-journal__body', {
              'ecos-journal__body_with-tabs': pageTabsIsShow,
              'ecos-journal__body_mobile': isMobile,
              'ecos-journal__body_with-preview': showPreview
            })}
          >
            <JournalsHead toggleMenu={this.toggleMenu} title={title} menuOpen={menuOpen} isMobile={isMobile} />

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
              hideModal={this.toggleSettings}
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
                  onApply={this.toggleSettings}
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
              showPreview={showPreview}
              showPie={showPie}
              maxHeight={availableHeight(height) - 165}
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
              height={availableHeight(height) - getScrollbarWidth()}
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
