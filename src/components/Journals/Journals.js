import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import JournalsTools from './JournalsTools';
import JournalsSettingBar from './JournalsSettingsBar';
import JournalsHead from './JournalsHead';
import JournalsContent from './JournalsContent';

import FormManager from '../EcosForm/FormManager';
import EcosModal from '../common/EcosModal/EcosModal';
import { getJournalsData, reloadGrid, search } from '../../actions/journals';
import { setActiveTabTitle } from '../../actions/pageTabs';
import { Well } from '../common/form';
import { t } from '../../helpers/util';
import { wrapArgs } from '../../helpers/redux';

import './Journals.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    pageTabsIsShow: state.pageTabs.isShow,
    journalConfig: newState.journalConfig,
    journalSetting: newState.journalSetting
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
    const {
      journalSetting: { columns, groupBy, sortBy, predicate },
      reloadGrid
    } = this.props;
    reloadGrid({ columns, groupBy, sortBy, predicates: predicate ? [predicate] : [] });
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
    FormManager.createRecordByVariant(createVariants[0]);
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
    const { stateId, journalConfig, pageTabsIsShow, setActiveTabTitle } = this.props;

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

    if (pageTabsIsShow && title && this.title !== title) {
      const quotes = String.fromCharCode(8221);
      setActiveTabTitle(`${t('page-tabs.journal')} ${quotes + title + quotes}`);
      this.title = title;
    }

    return (
      <div className={'ecos-journal'}>
        <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
          <JournalsHead toggleMenu={this.toggleMenu} title={title} menuOpen={menuOpen} />

          <JournalsTools journalConfig={journalConfig} addRecord={this.addRecord} onSearch={this.search} />

          <JournalsSettingBar
            stateId={stateId}
            showPreview={showPreview}
            showPie={showPie}
            toggleSettings={this.toggleSettings}
            togglePreview={this.togglePreview}
            togglePie={this.togglePie}
            showGrid={this.showGrid}
            refresh={this.refresh}
          />

          <EcosModal
            title={t('journals.action.setting-dialog-msg')}
            isOpen={settingsVisible}
            hideModal={this.toggleSettings}
            isBigHeader
            className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
          >
            <Well className={'ecos-journal__settings'}>
              <JournalsFilters stateId={stateId} columns={visibleColumns} sourceId={sourceId} metaRecord={metaRecord} />
              <JournalsColumnsSetup stateId={stateId} columns={visibleColumns} />
              <JournalsGrouping stateId={stateId} columns={visibleColumns} />
              <JournalsSettingsFooter
                stateId={stateId}
                journalId={journalId}
                onApply={this.toggleSettings}
                onCreate={this.toggleSettings}
              />
            </Well>
          </EcosModal>

          <JournalsContent stateId={stateId} showPreview={showPreview} showPie={showPie} />

          <div className={'ecos-journal__footer'}>
            <JournalsDashletPagination stateId={stateId} hasPageSize />
          </div>
        </div>

        <div className={`ecos-journal__menu ${pageTabsIsShow ? 'ecos-journal__menu_tabs' : ''}`}>
          <JournalsMenu stateId={stateId} open={menuOpen} onClose={this.toggleMenu} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
