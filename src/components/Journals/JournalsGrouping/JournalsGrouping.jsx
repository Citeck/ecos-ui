import React from 'react';

import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';

import './JournalsGrouping.scss';

const JournalsGrouping = props => {
  const { grouping, allowedColumns, onChange } = props;
  const columns = allowedColumns.filter(c => c.default);
  let groupingList = [];
  let aggregation = [];

  grouping.columns.forEach(groupingColumn => {
    const match = columns.filter(column => column.attribute === groupingColumn.attribute)[0];

    match ? groupingList.push(groupingColumn) : aggregation.push(groupingColumn);
  });

  return (
    <PanelBar
      header={t('journals.grouping.header')}
      className={'journals-grouping__panel-bar'}
      css={{ headerClassName: 'panel-bar__header_upper' }}
      open={false}
    >
      <Grouping
        className={'journals-grouping'}
        groupBy={grouping.groupBy}
        list={columns}
        grouping={groupingList}
        aggregation={aggregation}
        valueField={'attribute'}
        titleField={'text'}
        showAggregation={grouping.groupBy.length}
        onGrouping={onChange}
      />
    </PanelBar>
  );
};

export default JournalsGrouping;
