import React, { Component } from 'react';
import { Container } from 'reactstrap';
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

import { getJournalsData, reloadGrid } from '../../actions/journals';
import { Well } from '../common/form';
import { URL_PAGECONTEXT } from '../../constants/alfresco';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getJournalsData: ({ journalsListId, journalId, journalSettingId }) =>
    dispatch(getJournalsData({ journalsListId, journalId, journalSettingId })),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menuOpen: false,
      settingsVisible: false,
      showPreview: false,
      showPie: false
    };
  }

  componentDidMount() {
    const props = this.props;
    const { journalsListId = '', journalId = '', journalSettingId = '' } = props;
    props.getJournalsData({ journalsListId, journalId, journalSettingId });
  }

  refresh = () => {
    const props = this.props;
    const { journalsListId = '', journalId = '', journalSettingId = '' } = props;
    props.getJournalsData({ journalsListId, journalId, journalSettingId });
  };

  addRecord = () => {
    let {
      journalConfig: {
        meta: { createVariants = [{}] }
      }
    } = this.props;
    createVariants = createVariants[0];
    createVariants.canCreate &&
      window.open(`${URL_PAGECONTEXT}node-create?type=${createVariants.type}&destination=${createVariants.destination}&viewId=`, '_blank');
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
        columns = [],
        meta: { title = '' }
      }
    } = this.props;

    if (!columns.length) {
      return null;
    }

    return (
      <Container>
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
              <Well className={'ecos-journal__settings'}>
                <JournalsFilters columns={columns} />
                <JournalsColumnsSetup columns={columns} />
                <JournalsGrouping />
                <JournalsSettingsFooter />
              </Well>
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
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
