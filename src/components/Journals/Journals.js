import React, { Component } from 'react';
import { connect } from 'react-redux';

import JournalsDashletPagination from './JournalsDashletPagination';
import PageHeight from './PageHeight';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import JournalsSettingBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';

import FormManager from '../EcosForm/FormManager';
import EcosModal from '../common/EcosModal/EcosModal';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import { Scrollbars } from 'react-custom-scrollbars';
import { getJournalsData, reloadGrid, search } from '../../actions/journals';
import { setActiveTabTitle } from '../../actions/pageTabs';
import { Well } from '../common/form';
import { t, trigger } from '../../helpers/util';
import { goToCardDetailsPage } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    pageTabsIsShow: state.pageTabs.isShow,
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
    setActiveTabTitle: text => dispatch(setActiveTabTitle(text))
  };
};

class Journals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false,
      settingsVisible: false,
      showPreview: this.props.urlParams.showPreview,
      showPie: false
    };

    this.title = '';
  }

  componentDidMount() {
    this.getJournalsData();
  }

  componentDidUpdate(prevProps) {
    const journalId = this.props.urlParams.journalId;
    const prevJournalId = prevProps.urlParams.journalId;

    if (journalId !== prevJournalId) {
      this.getJournalsData();
    }
  }

  refresh = () => {
    this.props.reloadGrid();
  };

  getJournalsData() {
    this.props.getJournalsData();
  }

  addRecord = () => {
    let {
      journalConfig: {
        meta: { createVariants = [{}] }
      }
    } = this.props;

    FormManager.createRecordByVariant(createVariants[0], {
      onSubmit: record => {
        goToCardDetailsPage(record.id);
      }
    });
  };

  toggleSettings = () => {
    this.setState({ settingsVisible: !this.state.settingsVisible });
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
    this.setState({ menuOpen: !this.state.menuOpen });
  };

  search = text => {
    this.props.search(text);
  };

  render() {
    const { menuOpen, settingsVisible, showPreview, showPie } = this.state;
    const { stateId, journalConfig, pageTabsIsShow, grid } = this.props;

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

    trigger.call(this, 'onRender');

    const visibleColumns = columns.filter(c => c.visible);
    const journalSettingsClassName = 'ecos-journal__settings';

    return (
      <PageHeight>
        {height => (
          <div className={'ecos-journal'} style={{ height }}>
            <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
              <JournalsHead toggleMenu={this.toggleMenu} title={title} menuOpen={menuOpen} pageTabsIsShow={pageTabsIsShow} />

              <JournalsSettingBar
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
              />

              <EcosModal
                title={t('journals.action.setting-dialog-msg')}
                isOpen={settingsVisible}
                hideModal={this.toggleSettings}
                isBigHeader
                className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
              >
                <Well className={journalSettingsClassName}>
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
                    parentClass={journalSettingsClassName}
                    stateId={stateId}
                    journalId={journalId}
                    onApply={this.toggleSettings}
                    onCreate={this.toggleSettings}
                  />
                </Well>
              </EcosModal>

              <JournalsContent stateId={stateId} showPreview={showPreview} showPie={showPie} height={height - 165} />

              <div className={'ecos-journal__footer'}>
                <JournalsDashletPagination stateId={stateId} hasPageSize />
              </div>
            </div>

            <div className={`ecos-journal__menu ${pageTabsIsShow ? 'ecos-journal__menu_with-tabs' : ''}`} style={{ height }}>
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
