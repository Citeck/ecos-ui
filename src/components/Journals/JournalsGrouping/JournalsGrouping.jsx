import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t, trigger } from '../../../helpers/util';

import './JournalsGrouping.scss';

const mapStateToProps = state => ({
  journalSetting: state.journals.journalSetting,
  journalConfig: state.journals.journalConfig
});

class JournalsGrouping extends Component {
  onGrouping = grouping => {
    trigger.call(this, 'onChange', grouping);
  };

  render() {
    const { journalSetting, journalConfig } = this.props;
    const groupingColumns = journalSetting.columns;
    const { groupBy } = journalSetting;
    const { columns = [] } = journalConfig;

    let grouping = [];
    let aggregation = [];

    if (!columns.length) {
      return null;
    }

    groupBy.length &&
      groupingColumns.forEach(groupingColumn => {
        const match = columns.filter(column => column.attribute === groupingColumn.attribute)[0];
        match ? grouping.push(groupingColumn) : aggregation.push(groupingColumn);
      });

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
      >
        <Grouping
          className={'journals-grouping'}
          groupBy={groupBy}
          list={columns}
          grouping={grouping}
          aggregation={aggregation}
          valueField={'attribute'}
          titleField={'text'}
          onGrouping={this.onGrouping}
        />
      </PanelBar>
    );
  }
}

export default connect(mapStateToProps)(JournalsGrouping);
