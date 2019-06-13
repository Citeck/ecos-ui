import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import { withRouter } from 'react-router';

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

import EcosModal from '../common/EcosModal/EcosModal';
import { getJournalsData, reloadGrid } from '../../actions/journals';
import { getPreview, getJournalsListId, getJournalId, getJournalSettingId, goToCreateRecordPage, getFilters } from './urlManager';
import { Well } from '../common/form';
import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getJournalsData: options => dispatch(getJournalsData(options)),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false,
      settingsVisible: false,
      showPreview: getPreview(this.props.history.location),
      showPie: false
    };
  }

  componentDidMount() {
    this.getJournalsData();
  }

  refresh = () => {
    this.getJournalsData();
  };

  getJournalsData() {
    const location = this.props.history.location;
    this.props.getJournalsData({
      journalsListId: getJournalsListId(location),
      journalId: getJournalId(location),
      journalSettingId: getJournalSettingId(location),
      predicate: getFilters(location)
    });
  }

  addRecord = () => {
    let {
      journalConfig: {
        meta: { createVariants = [{}] }
      }
    } = this.props;
    createVariants = createVariants[0];
    createVariants.canCreate && goToCreateRecordPage(createVariants);
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

  render() {
    const { menuOpen, settingsVisible, showPreview, showPie } = this.state;
    const {
      journalConfig,
      journalConfig: {
        id: journalId,
        columns = [],
        meta: { title = '' }
      }
    } = this.props;

    if (!columns.length) {
      return null;
    }

    const visibleColumns = columns.filter(c => c.visible);

    return (
      <div className={'ecos-journal'}>
        <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
          <JournalsHead toggleMenu={this.toggleMenu} title={title} menuOpen={menuOpen} />

          <JournalsTools journalConfig={journalConfig} addRecord={this.addRecord} />

          <JournalsSettingBar
            showPreview={showPreview}
            showPie={showPie}
            toggleSettings={this.toggleSettings}
            togglePreview={this.togglePreview}
            togglePie={this.togglePie}
            showGrid={this.showGrid}
            refresh={this.refresh}
          />

          {settingsVisible ? (
            <EcosModal
              title={t('journals.action.setting-dialog-msg')}
              isOpen={settingsVisible}
              hideModal={this.toggleSettings}
              isBigHeader
              className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
            >
              <Well className={'ecos-journal__settings'}>
                <JournalsFilters columns={visibleColumns} />
                <JournalsColumnsSetup columns={columns} />
                <JournalsGrouping columns={visibleColumns} />
                <JournalsSettingsFooter journalId={journalId} />
              </Well>
            </EcosModal>
          ) : null}

          <JournalsContent showPreview={showPreview} showPie={showPie} />

          <div className={'ecos-journal__footer'}>
            <JournalsDashletPagination />
          </div>
        </div>

        <div className={'ecos-journal__menu'}>
          <JournalsMenu open={menuOpen} onClose={this.toggleMenu} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Journals));
