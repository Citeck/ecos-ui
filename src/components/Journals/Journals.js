import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import JournalsDashletPagination from './JournalsDashletPagination';
import PageHeight from './PageHeight';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import JournalsSettingsBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';

import FormManager from '../EcosForm/FormManager';
import EcosModal from '../common/EcosModal/EcosModal';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import { Well } from '../common/form';
import { getJournalsData, reloadGrid, restoreJournalSettingData, search } from '../../actions/journals';
import { t, trigger } from '../../helpers/util';
import { goToCardDetailsPage } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import { selectActiveTab } from '../../selectors/pageTabs';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow,
    activeTab: selectActiveTab(state),
    journalConfig: newState.journalConfig,
    grid: newState.grid
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    getJournalsData: options => dispatch(getJournalsData(w(options))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    search: text => dispatch(search(w(text))),
    restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting)))
  };
};

class Journals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false,
      menuOpenAnimate: false,
      settingsVisible: false,
      showPreview: this.props.urlParams.showPreview,
      showPie: false,
      savedSetting: null
    };
  }

  componentDidMount() {
    this.getJournalsData();
    trigger.call(this, 'onRender');
  }

  componentDidUpdate(prevProps) {
    const journalId = this.props.urlParams.journalId;
    const prevJournalId = prevProps.urlParams.journalId;

    if (journalId && journalId !== prevJournalId) {
      this.getJournalsData();
    }

    trigger.call(this, 'onRender');
  }

  refresh = () => {
    this.props.reloadGrid();
  };

  getJournalsData() {
    this.props.getJournalsData();
  }

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
    this.setState({
      showPreview: !this.state.showPreview,
      showPie: false
    });
  };

  togglePie = () => {
    this.setState({
      showPreview: false,
      showPie: !this.state.showPie
    });
  };

  showGrid = () => {
    this.setState({
      showPreview: false,
      showPie: false
    });
  };

  toggleMenu = () => {
    this.setState({ menuOpenAnimate: !this.state.menuOpenAnimate });

    setTimeout(
      () => {
        this.setState({ menuOpen: !this.state.menuOpen });
      },
      this.state.menuOpen ? 500 : 0
    );
  };

  search = text => {
    this.props.search(text);
  };

  render() {
    const { menuOpen, menuOpenAnimate, settingsVisible, showPreview, showPie } = this.state;
    const { stateId, journalConfig, pageTabsIsShow, grid, isMobile } = this.props;

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
      <PageHeight>
        {height => (
          <div className={classNames('ecos-journal', { 'ecos-journal_mobile': isMobile })}>
            <div
              className={classNames('ecos-journal__body', {
                'ecos-journal__body_with-tabs': pageTabsIsShow,
                'ecos-journal__body_mobile': isMobile
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
                refresh={this.refresh}
                onSearch={this.search}
                addRecord={this.addRecord}
                isMobile={isMobile}
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

              <JournalsContent stateId={stateId} showPreview={showPreview} showPie={showPie} maxHeight={height - 165} />

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
              <JournalsMenu stateId={stateId} open={menuOpen} onClose={this.toggleMenu} height={height} />
            </div>
          </div>
        )}
      </PageHeight>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
