import React from 'react';
import get from 'lodash/get';
import forEach from 'lodash/forEach';

import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';

import './JournalsGrouping.scss';

const JournalsGrouping = props => {
  const { grouping, allowedColumns = [], onChange } = props;
  const columns = allowedColumns.filter(c => c.default);
  let groupingList = [];
  let aggregation = [];

  forEach(get(grouping, 'columns'), groupingColumn => {
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
        groupBy={get(grouping, 'groupBy')}
        list={columns}
        grouping={groupingList}
        aggregation={aggregation}
        valueField={'attribute'}
        titleField={'text'}
        showAggregation={get(grouping, 'groupBy.length')}
        onGrouping={onChange}
      />
    </PanelBar>
  );
};

export default JournalsGrouping;
