import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Container } from 'reactstrap';
import classNames from 'classnames';
import JournalsDashletEditor from '../JournalsDashletEditor';
import Dashlet from '../../Dashlet/Dashlet';
import Grid from '../../common/grid/Grid/Grid';
import Pagination from '../../common/Pagination/Pagination';
import Export from '../../Export/Export';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { PROXY_URI } from '../../../constants/alfresco';
import {
  getDashletConfig,
  setDashletEditorVisible,
  reloadGrid,
  setJournalsItem,
  setPage,
  deleteRecords,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible
} from '../../../actions/journals';

import './JournalsDashlet.scss';

const mapStateToProps = state => ({
  dashletIsReady: state.journals.dashletIsReady,
  editorVisible: state.journals.editorVisible,
  journalsList: state.journals.journalsList,
  journals: state.journals.journals,
  gridData: state.journals.gridData,
  config: state.journals.config,
  pagination: state.journals.pagination,
  journalConfig: state.journals.journalConfig,
  selectedRecords: state.journals.selectedRecords,
  selectAllRecords: state.journals.selectAllRecords,
  selectAllRecordsVisible: state.journals.selectAllRecordsVisible
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  setDashletEditorVisible: visible => dispatch(setDashletEditorVisible(visible)),
  reloadGrid: ({ journalId, pagination }) => dispatch(reloadGrid({ journalId: journalId, pagination: pagination })),
  setJournalsItem: item => dispatch(setJournalsItem(item)),
  setPage: page => dispatch(setPage(page)),
  deleteRecords: records => dispatch(deleteRecords(records)),
  setSelectedRecords: records => dispatch(setSelectedRecords(records)),
  setSelectAllRecords: need => dispatch(setSelectAllRecords(need)),
  setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(visible))
});

class JournalsDashlet extends Component {
  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  showEditor = () => {
    this.props.setDashletEditorVisible(true);
  };

  goToJournalsPage = () => {
    window.location = `${PROXY_URI}journals`;
  };

  addRecord = () => {
    const journalConfig = this.props.journalConfig;

    if (journalConfig) {
      const createVariants = ((journalConfig.meta || {}).createVariants || [])[0] || {};
      createVariants.canCreate &&
        window.open(`node-create?type=${createVariants.type}&destination=${createVariants.destination}&viewId=`, '_blank');
    }
  };

  onChangeJournal = journal => {
    const props = this.props;

    props.setJournalsItem(journal);
    props.setPage(1);
    props.reloadGrid({
      journalId: journal.nodeRef
    });
  };

  onChangePage = pagination => {
    const props = this.props;

    props.setPage(pagination.page);
    props.reloadGrid({
      journalId: props.config.journalId,
      pagination: pagination
    });
  };

  onReloadDashlet = () => {
    const props = this.props;

    props.setPage(1);
    props.reloadGrid({
      journalId: props.config.journalId
    });
  };

  getJournalsListName = () => {
    const props = this.props;
    const config = props.config || {};
    const journalsList = props.journalsList || [];

    let journalList = journalsList.filter(journalList => journalList.id === config.journalsListId)[0] || {};

    return journalList.title || 'Журналы';
  };

  setSelectedRecords = e => {
    const props = this.props;
    props.setSelectedRecords(e.selected);
    props.setSelectAllRecordsVisible(e.all);

    if (!e.all) {
      props.setSelectAllRecords(false);
    }
  };

  setSelectAllRecords = () => {
    const props = this.props;
    props.setSelectAllRecords(!props.selectAllRecords);

    if (!props.selectAllRecords) {
      props.setSelectedRecords([]);
    }
  };

  render() {
    const props = this.props;
    const config = props.config || {};
    const cssClasses = classNames('journal-dashlet', props.className);

    const pagination = props.gridData.total ? (
      <Pagination className={'dashlet__pagination'} total={props.gridData.total} {...props.pagination} onChange={this.onChangePage} />
    ) : null;

    return (
      <Container>
        {props.dashletIsReady ? (
          <Dashlet
            {...props}
            title={this.getJournalsListName()}
            className={cssClasses}
            onEdit={this.showEditor}
            onReload={this.onReloadDashlet}
            onGoTo={this.goToJournalsPage}
          >
            {props.editorVisible ? (
              <JournalsDashletEditor id={props.id} />
            ) : (
              <Fragment>
                <div className={'journal-dashlet__toolbar'}>
                  <IcoBtn
                    icon={'icon-big-plus'}
                    className={'btn_i btn_i-big-plus btn_blue btn_hover_light-blue btn_x-step_10'}
                    onClick={this.addRecord}
                  />

                  <Dropdown
                    source={props.journals}
                    value={config.journalId}
                    valueField={'nodeRef'}
                    titleField={'title'}
                    onClick={this.onChangeJournal}
                  >
                    <IcoBtn invert={'true'} icon={'icon-down'} className={'btn_drop-down btn_r_6 btn_x-step_10'} />
                  </Dropdown>

                  <Dropdown source={[{ title: 'Мои настройки', id: 0 }]} value={0} valueField={'id'} titleField={'title'} isButton={true}>
                    <TwoIcoBtn icons={['icon-settings', 'icon-down']} className={'btn_grey btn_settings-down btn_x-step_10'} />
                  </Dropdown>

                  <Export config={props.journalConfig} />

                  <div className={'dashlet__actions'}>
                    {pagination}
                    <IcoBtn icon={'icon-list'} className={'btn_i btn_blue2 btn_width_auto btn_hover_t-light-blue btn_x-step_10'} />
                    <IcoBtn icon={'icon-pie'} className={'btn_i btn_grey2 btn_width_auto btn_hover_t-light-blue'} />
                  </div>
                </div>

                <div className={'journal-dashlet__grid'}>
                  <Grid
                    {...props.gridData}
                    hasCheckboxes
                    onDelete={props.deleteRecords}
                    onSelectAll={this.setSelectAllRecords}
                    onSelect={this.setSelectedRecords}
                    selected={props.selectedRecords}
                    selectAllRecords={props.selectAllRecords}
                    selectAllRecordsVisible={props.selectAllRecordsVisible}
                  />
                </div>

                <div className={'journal-dashlet__footer'}>{pagination}</div>
              </Fragment>
            )}
          </Dashlet>
        ) : null}
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashlet);
