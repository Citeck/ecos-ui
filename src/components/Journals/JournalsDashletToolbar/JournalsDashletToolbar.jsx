import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Export from '../../Export/Export';
import JournalsDashletPagination from '../JournalsDashletPagination';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { reloadGrid, reloadTreeGrid, setPage, setJournalsItem } from '../../../actions/journals';

const mapStateToProps = state => ({
  journals: state.journals.journals,
  config: state.journals.config,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria })),
  setPage: page => dispatch(setPage(page)),
  setJournalsItem: journal => dispatch(setJournalsItem(journal)),
  reloadTreeGrid: journal => dispatch(reloadTreeGrid())
});

class JournalsDashletToolbar extends Component {
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
    props.setPage(1);
    props.reloadGrid({ journalId: journal.nodeRef });
    props.setJournalsItem(journal);
  };

  onChangeSettings = () => {
    this.props.reloadTreeGrid();
  };

  render() {
    const props = this.props;
    const config = props.config || {};

    return (
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
          onChange={this.onChangeJournal}
        >
          <IcoBtn invert={'true'} icon={'icon-down'} className={'btn_drop-down btn_r_6 btn_x-step_10'} />
        </Dropdown>

        <Dropdown
          source={[{ title: 'Группировка', id: 0 }]}
          value={0}
          valueField={'id'}
          titleField={'title'}
          isButton={true}
          onChange={this.onChangeSettings}
        >
          <TwoIcoBtn icons={['icon-settings', 'icon-down']} className={'btn_grey btn_settings-down btn_x-step_10'} />
        </Dropdown>

        <Export config={props.journalConfig} />

        <div className={'dashlet__actions'}>
          <JournalsDashletPagination />
          <IcoBtn icon={'icon-list'} className={'btn_i btn_blue2 btn_width_auto btn_hover_t-light-blue btn_x-step_10'} />
          <IcoBtn icon={'icon-pie'} className={'btn_i btn_grey2 btn_width_auto btn_hover_t-light-blue'} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletToolbar);
