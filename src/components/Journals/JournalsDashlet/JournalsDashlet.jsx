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
import { getDashletConfig, setDashletEditorVisible, reloadGrid, setJournalsItem } from '../../../actions/journals';

import './JournalsDashlet.scss';

const mapStateToProps = state => ({
  dashletIsReady: state.journals.dashletIsReady,
  editorVisible: state.journals.editorVisible,
  journals: state.journals.journals,
  gridData: state.journals.gridData,
  config: state.journals.config,
  page: state.journals.page,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  setDashletEditorVisible: visible => dispatch(setDashletEditorVisible(visible)),
  reloadGrid: ({ journalId, page }) => dispatch(reloadGrid({ journalId: journalId, page: page })),
  setJournalsItem: item => dispatch(setJournalsItem(item))
});

class JournalsDashlet extends Component {
  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  showEditor = () => {
    this.props.setDashletEditorVisible(true);
  };

  reloadGrid = ({ journalId, page }) => {
    const props = this.props;
    const config = props.config || {};

    props.reloadGrid({
      journalId: journalId || config.journalId,
      page: page
    });
  };

  goToJournalsPage = () => {
    window.location = `${PROXY_URI}journals`;
  };

  addRecord = () => {
    const config = this.props.config || {};
    window.open(`${PROXY_URI}node-create-page?type=${'contracts:agreement'}&destination=${config.journalId}&viewId=`, '_blank');
  };

  onChangeJournal = journal => {
    this.props.setJournalsItem(journal);

    this.reloadGrid({
      journalId: journal.nodeRef
    });
  };

  render() {
    const props = this.props;
    const config = props.config || {};
    const cssClasses = classNames('journal-dashlet', props.className);

    return (
      <Container>
        {props.dashletIsReady ? (
          <Dashlet {...props} className={cssClasses} onEdit={this.showEditor} onReload={this.reloadGrid} onGoTo={this.goToJournalsPage}>
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
                    <IcoBtn invert={'true'} icon={'icon-down'} className={'btn_drop-down btn_r_6 btn_x-step_10'}>
                      Договоры
                    </IcoBtn>
                  </Dropdown>

                  <Dropdown source={[{ title: 'Мои настройки', id: 0 }]} value={0} valueField={'id'} titleField={'title'} isButton={true}>
                    <TwoIcoBtn icons={['icon-settings', 'icon-down']} className={'btn_grey btn_settings-down btn_x-step_10'} />
                  </Dropdown>

                  <Export config={props.journalConfig} />

                  <div className={'dashlet__actions'}>
                    <Pagination className={'dashlet__pagination'} total={props.gridData.total} onChange={this.reloadGrid} />

                    <IcoBtn icon={'icon-list'} className={'btn_i btn_blue2 btn_width_auto btn_hover_t-light-blue btn_x-step_10'} />
                    <IcoBtn icon={'icon-pie'} className={'btn_i btn_grey2 btn_width_auto btn_hover_t-light-blue'} />
                  </div>
                </div>

                <div className={'journal-dashlet__grid'}>
                  <Grid {...props.gridData} hasCheckboxes />
                </div>

                <div className={'journal-dashlet__footer'}>
                  <Pagination className={'dashlet__pagination'} total={props.gridData.total} onChange={this.reloadGrid} />
                </div>
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
